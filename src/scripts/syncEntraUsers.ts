/*
  Script to sync users from Microsoft Entra ID (Azure AD) into local DB.
  - Creates missing users
  - Updates names/emails
  - Disables users not found (optional)
*/
import {
  ENTRA_CLIENT_ID,
  ENTRA_CLIENT_SECRET,
  ENTRA_TENANT_ID,
} from "../config/env.config";
import {
  addUser,
  getUserByEntraId,
  updateUser,
} from "../services/usersService";
import { oneOrNone, some } from "../db";
import { User } from "../interfaces/user";

async function getAccessToken(): Promise<string> {
  if (!ENTRA_TENANT_ID || !ENTRA_CLIENT_ID || !ENTRA_CLIENT_SECRET) {
    throw new Error(
      "Missing ENTRA_TENANT_ID/ENTRA_CLIENT_ID/ENTRA_CLIENT_SECRET",
    );
  }
  const url = `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: ENTRA_CLIENT_ID,
    client_secret: ENTRA_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const res = await fetch(url, {
    method: "POST",
    body: body as unknown as BodyInit,
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

type GraphUser = {
  id: string;
  givenName?: string;
  surname?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
  employeeId?: string;
};

async function fetchAllUsers(token: string): Promise<GraphUser[]> {
  const users: GraphUser[] = [];
  let url =
    "https://graph.microsoft.com/v1.0/users?$select=id,givenName,surname,displayName,mail,userPrincipalName,accountEnabled,employeeId";
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Graph request failed: ${res.status}`);
    const json = (await res.json()) as {
      value: GraphUser[];
      "@odata.nextLink"?: string;
    };
    users.push(...json.value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    url = (json as any)["@odata.nextLink"] || "";
  }
  return users;
}

// Local helpers to check uniqueness
async function findUserByEmail(email: string): Promise<User | null> {
  const sql =
    'SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.dni, u.email, u.active, u.entra_id AS "entraId" FROM users u WHERE u.email = $1';
  return await oneOrNone<User>(sql, [email]);
}

async function findUserByDni(dni: number): Promise<User | null> {
  const sql =
    'SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.dni, u.email, u.active, u.entra_id AS "entraId" FROM users u WHERE u.dni = $1';
  return await oneOrNone<User>(sql, [dni]);
}

export async function runSync({
  disableMissing = true,
}: { disableMissing?: boolean } = {}) {
  const token = await getAccessToken();
  const graphUsers = await fetchAllUsers(token);

  const seenEntraIds = new Set<string>();

  function parseDniFromCuit(input?: string): number | undefined {
    if (!input) return undefined;
    const digits = input.replace(/\D+/g, "");
    // CUIT/CUIL: 2 base digits + DNI (7 or 8 digits) + 1 check digit => total 10 or 11 digits
    if (digits.length === 10 || digits.length === 11) {
      const dniDigits = digits.slice(2, -1); // middle portion
      if (dniDigits.length === 7 || dniDigits.length === 8) {
        const n = parseInt(dniDigits, 10);
        if (!Number.isNaN(n)) return n;
      }
    }
    // If employeeId is already just DNI (7-8 digits), accept it
    if (digits.length === 7 || digits.length === 8) {
      const n = parseInt(digits, 10);
      if (!Number.isNaN(n)) return n;
    }
    return undefined;
  }

  for (const gu of graphUsers) {
    const entraId = gu.id;
    seenEntraIds.add(entraId);
    const email = gu.mail || gu.userPrincipalName || undefined;
    const firstName =
      gu.givenName || (gu.displayName ? gu.displayName.split(" ")[0] : "");
    const lastName =
      gu.surname ||
      (gu.displayName ? gu.displayName.split(" ").slice(1).join(" ") : "");
    const active = gu.accountEnabled ?? true;
    const dniFromEmployeeId = parseDniFromCuit(gu.employeeId);

    const existing = await getUserByEntraId(entraId);
    if (existing) {
      const patch: Partial<User> = { firstName, lastName, active };

      // Email update with uniqueness check
      if (email && email !== existing.email) {
        const byEmail = await findUserByEmail(email);
        if (byEmail && byEmail.id !== existing.id) {
          console.warn(
            `⚠️ Email conflict for ${email} (entraId=${entraId}). Already used by user ${byEmail.id}. Skipping email update.`,
          );
        } else {
          patch.email = email;
        }
      }

      // DNI update with uniqueness check
      if (dniFromEmployeeId && existing.dni !== dniFromEmployeeId) {
        const byDni = await findUserByDni(dniFromEmployeeId);
        if (byDni && byDni.id !== existing.id) {
          console.warn(
            `⚠️ DNI conflict for ${dniFromEmployeeId} (entraId=${entraId}). Already used by user ${byDni.id}. Skipping DNI update.`,
          );
        } else {
          patch.dni = dniFromEmployeeId;
        }
      }

      if (Object.keys(patch).length > 0) {
        await updateUser(existing.id, patch);
      }
    } else {
      // Creation path: require both email and DNI
      if (!email) {
        console.warn(
          `⚠️ Skipping creation for entraId=${entraId}: missing email`,
        );
        continue;
      }
      if (!dniFromEmployeeId) {
        console.warn(
          `⚠️ Skipping creation for entraId=${entraId}: missing DNI (employeeId not parseable)`,
        );
        continue;
      }

      // Uniqueness checks prior to creation
      const [byEmail, byDni] = await Promise.all([
        findUserByEmail(email),
        findUserByDni(dniFromEmployeeId),
      ]);
      if (byEmail) {
        console.warn(
          `⚠️ Not creating user entraId=${entraId}: email ${email} already used by user ${byEmail.id}`,
        );
        continue;
      }
      if (byDni) {
        console.warn(
          `⚠️ Not creating user entraId=${entraId}: DNI ${dniFromEmployeeId} already used by user ${byDni.id}`,
        );
        continue;
      }

      const newUser: User = {
        id: "00000000-0000-0000-0000-000000000000",
        firstName: firstName || "User",
        lastName: lastName || "-",
        email,
        dni: dniFromEmployeeId,
        active,
        entraId,
      };
      await addUser(newUser);
    }
  }

  if (disableMissing) {
    const ids = Array.from(seenEntraIds);
    // Deactivate users whose entra_id is not in the current set
    await some(
      "UPDATE users SET active = false WHERE entra_id IS NOT NULL AND active = true AND NOT (entra_id = ANY($1::text[]))",
      [ids],
    );
  }
}

if (require.main === module) {
  runSync()
    .then(() => {
      console.log("✅ Sync completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Sync failed", err);
      process.exit(1);
    });
}
