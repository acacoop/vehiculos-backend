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
import { AppDataSource } from "../db";
import type { User } from "../types";

const VERBOSE =
  process.env.VERBOSE === "1" || process.argv.includes("--verbose");

type SkipReason =
  | { kind: "missing_email"; entraId: string }
  | { kind: "missing_dni"; entraId: string; employeeId?: string }
  | {
      kind: "email_conflict";
      entraId: string;
      email: string;
      existingUserId: string;
    }
  | {
      kind: "dni_conflict";
      entraId: string;
      dni: number;
      existingUserId: string;
    };

type Stats = {
  created: number;
  updated: number;
  skippedCreate: SkipReason[];
  cannotUpdateCount: number; // updates fully blocked by conflicts (no fields applied)
};

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
  const repo = AppDataSource.getRepository("users");
  // Using query builder to select needed columns and map manually
  const row = await repo
    .createQueryBuilder("u")
    .select([
      "u.id",
      "u.first_name",
      "u.last_name",
      "u.dni",
      "u.email",
      "u.active",
      "u.entra_id",
    ]) // raw columns
    .where("u.email = :email", { email })
    .getRawOne();
  if (!row) return null;
  return {
    id: row.u_id,
    firstName: row.u_first_name,
    lastName: row.u_last_name,
    dni: row.u_dni,
    email: row.u_email,
    active: row.u_active,
    entraId: row.u_entra_id,
  } as User;
}

async function findUserByDni(dni: number): Promise<User | null> {
  const repo = AppDataSource.getRepository("users");
  const row = await repo
    .createQueryBuilder("u")
    .select([
      "u.id",
      "u.first_name",
      "u.last_name",
      "u.dni",
      "u.email",
      "u.active",
      "u.entra_id",
    ])
    .where("u.dni = :dni", { dni })
    .getRawOne();
  if (!row) return null;
  return {
    id: row.u_id,
    firstName: row.u_first_name,
    lastName: row.u_last_name,
    dni: row.u_dni,
    email: row.u_email,
    active: row.u_active,
    entraId: row.u_entra_id,
  } as User;
}

export async function runSync({
  disableMissing = true,
}: { disableMissing?: boolean } = {}) {
  const token = await getAccessToken();
  const graphUsers = await fetchAllUsers(token);

  const seenEntraIds = new Set<string>();
  const stats: Stats = {
    created: 0,
    updated: 0,
    skippedCreate: [],
    cannotUpdateCount: 0,
  };

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
      // Build patch only with changed values
      const patch: Partial<User> = {};
      if (firstName !== undefined && firstName !== existing.firstName) {
        patch.firstName = firstName;
      }
      if (lastName !== undefined && lastName !== existing.lastName) {
        patch.lastName = lastName;
      }
      if (active !== undefined && active !== existing.active) {
        patch.active = active;
      }
      let hadConflicts = false;

      // Email update with uniqueness check
      if (email && email !== existing.email) {
        const byEmail = await findUserByEmail(email);
        if (byEmail && byEmail.id !== existing.id) {
          hadConflicts = true;
          if (VERBOSE) {
            // concise, single-line verbose detail
            console.log(
              `conflict:update email entraId=${entraId} email=${email} usedBy=${byEmail.id}`,
            );
          }
        } else {
          patch.email = email;
        }
      }

      // DNI update with uniqueness check
      if (dniFromEmployeeId && existing.dni !== dniFromEmployeeId) {
        const byDni = await findUserByDni(dniFromEmployeeId);
        if (byDni && byDni.id !== existing.id) {
          hadConflicts = true;
          if (VERBOSE) {
            console.log(
              `conflict:update dni entraId=${entraId} dni=${dniFromEmployeeId} usedBy=${byDni.id}`,
            );
          }
        } else {
          patch.dni = dniFromEmployeeId;
        }
      }

      const keys = Object.keys(patch);
      if (keys.length > 0) {
        await updateUser(existing.id, patch);
        stats.updated += 1;
        if (VERBOSE) {
          console.log(
            `ok:update entraId=${entraId} userId=${existing.id} fields=${keys.join("|")}`,
          );
        }
      } else if (hadConflicts) {
        // Update attempted but fully blocked by conflicts
        stats.cannotUpdateCount += 1;
      } else if (VERBOSE) {
        // No changes needed
        console.log(`ok:noop entraId=${entraId} userId=${existing.id}`);
      }
    } else {
      // Creation path: require both email and DNI
      if (!email) {
        stats.skippedCreate.push({ kind: "missing_email", entraId });
        continue;
      }
      if (!dniFromEmployeeId) {
        stats.skippedCreate.push({
          kind: "missing_dni",
          entraId,
          employeeId: gu.employeeId,
        });
        continue;
      }

      // Uniqueness checks prior to creation
      const [byEmail, byDni] = await Promise.all([
        findUserByEmail(email),
        findUserByDni(dniFromEmployeeId),
      ]);
      if (byEmail) {
        stats.skippedCreate.push({
          kind: "email_conflict",
          entraId,
          email,
          existingUserId: byEmail.id,
        });
        continue;
      }
      if (byDni) {
        stats.skippedCreate.push({
          kind: "dni_conflict",
          entraId,
          dni: dniFromEmployeeId,
          existingUserId: byDni.id,
        });
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
      const created = await addUser(newUser);
      stats.created += 1;
      if (VERBOSE) {
        console.log(
          `ok:create entraId=${entraId} userId=${created?.id ?? "unknown"}`,
        );
      }
    }
  }

  if (disableMissing) {
    const ids = Array.from(seenEntraIds);
    // Deactivate users whose entra_id is not in the current set
    // Deactivate users whose entra_id not in list (raw query via queryRunner for efficiency)
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    // For MSSQL we'll use a temporary table logic; simpler approach: fetch and iterate
    const userRepo = AppDataSource.getRepository("users");
    const toDeactivate = await userRepo
      .createQueryBuilder("u")
      .where("u.entra_id IS NOT NULL")
      .andWhere("u.active = :active", { active: true })
      .getMany();
    // Entities returned include entraId (camel case) if mapped; fallback to raw property names
    interface MutableUserEntity {
      id: string;
      entraId?: string;
      entra_id?: string;
      active: boolean;
    }
    for (const u of toDeactivate as unknown as MutableUserEntity[]) {
      const currentEntra = u.entraId ?? u.entra_id;
      if (currentEntra && !ids.includes(currentEntra)) {
        u.active = false;
        await userRepo.save(u as object as unknown as Record<string, unknown>);
      }
    }
    await queryRunner.release();
  }

  // Output section
  if (VERBOSE && stats.skippedCreate.length > 0) {
    for (const s of stats.skippedCreate) {
      switch (s.kind) {
        case "missing_email":
          console.log(`skip:create missing_email entraId=${s.entraId}`);
          break;
        case "missing_dni":
          console.log(
            `skip:create missing_dni entraId=${s.entraId} employeeId=${s.employeeId ?? ""}`,
          );
          break;
        case "email_conflict":
          console.log(
            `skip:create email_conflict entraId=${s.entraId} email=${s.email} usedBy=${s.existingUserId}`,
          );
          break;
        case "dni_conflict":
          console.log(
            `skip:create dni_conflict entraId=${s.entraId} dni=${s.dni} usedBy=${s.existingUserId}`,
          );
          break;
      }
    }
  }

  console.log(
    `summary created=${stats.created} updated=${stats.updated} cannot_update=${stats.cannotUpdateCount} skipped_create=${stats.skippedCreate.length}`,
  );
}

if (require.main === module) {
  runSync()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Sync failed", err);
      process.exit(1);
    });
}
