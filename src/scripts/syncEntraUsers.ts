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
import UsersService from "../services/usersService";
import { AppDataSource } from "../db";
import type { User } from "../schemas/user";
import { User as UserEntity } from "../entities/User";

const VERBOSE =
  process.env.VERBOSE === "1" || process.argv.includes("--verbose");

type SkipReason =
  | { kind: "missing_email"; entraId: string }
  | { kind: "missing_cuit"; entraId: string }
  | {
      kind: "email_conflict";
      entraId: string;
      email: string;
      existingUserId: string;
    }
  | {
      kind: "cuit_conflict";
      entraId: string;
      cuit: number;
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
  onPremisesExtensionAttributes?: { extensionAttribute1?: string };
};

async function fetchAllUsers(token: string): Promise<GraphUser[]> {
  const users: GraphUser[] = [];
  let url =
    "https://graph.microsoft.com/v1.0/users?$select=id,givenName,surname,displayName,mail,userPrincipalName,accountEnabled,onPremisesExtensionAttributes";
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

export async function runSync({
  disableMissing = true,
}: { disableMissing?: boolean } = {}) {
  const usersService = new UsersService();
  const token = await getAccessToken();
  const graphUsers = await fetchAllUsers(token);

  const seenEntraIds = new Set<string>();
  const stats: Stats = {
    created: 0,
    updated: 0,
    skippedCreate: [],
    cannotUpdateCount: 0,
  };

  function parseCuit(input?: string): number | undefined {
    if (!input) return undefined;
    const digits = input.replace(/\D+/g, "");
    if (digits.length === 11) return Number(digits);
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
    const entraCuit = gu.onPremisesExtensionAttributes?.extensionAttribute1;
    const cuit = parseCuit(entraCuit);

    const existing = await usersService.getByEntraId(entraId);
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
        const byEmail = await usersService.getByEmail(email);
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

      // CUIT update with uniqueness check
      if (cuit && existing.cuit !== cuit) {
        const byCuit = await usersService.getByCuit(cuit);
        if (byCuit && byCuit.id !== existing.id) {
          hadConflicts = true;
          if (VERBOSE) {
            console.log(
              `conflict:update cuit entraId=${entraId} cuit=${cuit} usedBy=${byCuit.id}`,
            );
          }
        } else {
          patch.cuit = cuit;
        }
      }

      const keys = Object.keys(patch);
      if (keys.length > 0) {
        await usersService.update(existing.id as string, patch);
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
      // Creation path: require both email and CUIT
      if (!email) {
        stats.skippedCreate.push({ kind: "missing_email", entraId });
        continue;
      }
      if (!cuit) {
        stats.skippedCreate.push({
          kind: "missing_cuit",
          entraId,
        });
        continue;
      }

      // Uniqueness checks prior to creation
      const [byEmail, byCuit] = await Promise.all([
        usersService.getByEmail(email),
        usersService.getByCuit(cuit),
      ]);
      if (byEmail && byEmail.id) {
        stats.skippedCreate.push({
          kind: "email_conflict",
          entraId,
          email,
          existingUserId: byEmail.id,
        });
        continue;
      }
      if (byCuit && byCuit.id) {
        stats.skippedCreate.push({
          kind: "cuit_conflict",
          entraId,
          cuit,
          existingUserId: byCuit.id,
        });
        continue;
      }

      const created = await usersService.create({
        firstName: firstName || "User",
        lastName: lastName || "-",
        email,
        cuit,
        active,
        entraId,
      } as User);
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
    const userRepo = AppDataSource.getRepository(UserEntity);
    const activeUsers = await userRepo.find({ where: { active: true } });
    for (const u of activeUsers) {
      if (u.entraId && !ids.includes(u.entraId)) {
        u.active = false;
        await userRepo.save(u);
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
        case "missing_cuit":
          console.log(`skip:create missing_cuit entraId=${s.entraId}`);
          break;
        case "email_conflict":
          console.log(
            `skip:create email_conflict entraId=${s.entraId} email=${s.email} usedBy=${s.existingUserId}`,
          );
          break;
        case "cuit_conflict":
          console.log(
            `skip:create cuit_conflict entraId=${s.entraId} cuit=${s.cuit} usedBy=${s.existingUserId}`,
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
