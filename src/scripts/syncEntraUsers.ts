import {
  ENTRA_CLIENT_ID,
  ENTRA_CLIENT_SECRET,
  ENTRA_TENANT_ID,
} from "../config/env.config";
import { AppDataSource } from "../db";
import type { User } from "../schemas/user";
import { User as UserEntity } from "../entities/User";
import { ServiceFactory } from "../factories/serviceFactory";
import { UsersService } from "../services/usersService";

const VERBOSE =
  process.env.VERBOSE === "1" || process.argv.includes("--verbose");

const DISABLE_MISSING = true;

const GRAPH_REQUEST = "https://graph.microsoft.com/v1.0/users";
const FIELDS = [
  "id",
  "givenName",
  "surname",
  "displayName",
  "mail",
  "userPrincipalName",
  "accountEnabled",
  "onPremisesExtensionAttributes",
];

type Created = { kind: "created"; entraId: string; userId: string };

type Updated = {
  kind: "updated";
  entraId: string;
  userId: string;
  changes: string;
};

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
      cuit: string;
      existingUserId: string;
    };

type CannotUpdateReason =
  | {
      kind: "email_conflict";
      entraId: string;
      email: string;
      existingUserId: string;
    }
  | {
      kind: "cuit_conflict";
      entraId: string;
      cuit: string;
      existingUserId: string;
    };

type Stats = {
  created: Created[];
  updated: Updated[];
  skippedCreate: SkipReason[];
  cannotUpdate: CannotUpdateReason[];
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
  let url = `${GRAPH_REQUEST}?$select=${FIELDS.join(",")}`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Graph request failed: ${res.status}`);

    const response = (await res.json()) as {
      value: GraphUser[];
      "@odata.nextLink"?: string;
    };

    users.push(...response.value);
    url = response["@odata.nextLink"] || "";
  }
  return users;
}

function parseCuit(input?: string): string | undefined {
  if (!input) return undefined;
  const digits = input.replace(/\D+/g, "");
  if (digits.length === 11) return digits;
  return undefined;
}

function parseGraphUser(input: GraphUser): User {
  const entraCuit = input.onPremisesExtensionAttributes?.extensionAttribute1;

  return {
    entraId: input.id,
    firstName: input.givenName || "User",
    lastName: input.surname || "-",
    email: input.mail || input.userPrincipalName || undefined,
    active: input.accountEnabled ?? true,
    cuit: parseCuit(entraCuit),
  } as User;
}

function hasDiff(
  key: keyof UserEntity,
  existing: UserEntity,
  incoming: User,
): boolean {
  return incoming[key] !== undefined && incoming[key] !== existing[key];
}

function getDiff(existing: UserEntity, incoming: User): Partial<UserEntity> {
  const diff: Partial<User> = {};

  if (hasDiff("firstName", existing, incoming)) {
    diff.firstName = incoming.firstName;
  }
  if (hasDiff("lastName", existing, incoming)) {
    diff.lastName = incoming.lastName;
  }
  if (hasDiff("email", existing, incoming)) {
    diff.email = incoming.email;
  }
  if (hasDiff("cuit", existing, incoming)) {
    diff.cuit = incoming.cuit;
  }
  if (hasDiff("active", existing, incoming)) {
    diff.active = incoming.active;
  }

  return diff;
}

async function parseAndSyncUsers(
  graphUsers: GraphUser[],
  usersService: UsersService,
): Promise<{ stats: Stats; seenEntraIds: Set<string> }> {
  const seenEntraIds = new Set<string>();
  const stats: Stats = {
    created: [],
    updated: [],
    skippedCreate: [],
    cannotUpdate: [],
  };

  for (const gu of graphUsers) {
    const user = parseGraphUser(gu);
    seenEntraIds.add(user.entraId);

    const [byEntraId, byEmail, byCuit] = await Promise.all([
      usersService.getByEntraId(user.entraId),
      usersService.getByEmail(user.email),
      usersService.getByCuit(user.cuit),
    ]);

    if (byEntraId) {
      const patch = getDiff(byEntraId, user);
      if (patch.email) {
        const byEmail = await usersService.getByEmail(patch.email);
        if (byEmail && byEmail.id !== byEntraId.id) {
          stats.cannotUpdate.push({
            kind: "email_conflict",
            entraId: user.entraId,
            email: patch.email,
            existingUserId: byEmail.id,
          });
          continue;
        }
      }

      if (patch.cuit) {
        const byCuit = await usersService.getByCuit(patch.cuit);
        if (byCuit && byCuit.id !== byEntraId.id) {
          stats.cannotUpdate.push({
            kind: "cuit_conflict",
            entraId: user.entraId,
            cuit: patch.cuit,
            existingUserId: byCuit.id,
          });
          continue;
        }
      }

      const keys = Object.keys(patch);
      if (keys.length > 0) {
        await usersService.update(byEntraId.id, patch);

        const changes = `old: ${JSON.stringify(byEntraId)} new: ${JSON.stringify({ ...byEntraId, ...patch })}`;

        stats.updated.push({
          kind: "updated",
          entraId: user.entraId,
          userId: byEntraId.id,
          changes,
          // do a key old-new diff
        });
      }
    } else {
      if (!user.email) {
        stats.skippedCreate.push({
          kind: "missing_email",
          entraId: user.entraId,
        });
        continue;
      }
      if (!user.cuit) {
        stats.skippedCreate.push({
          kind: "missing_cuit",
          entraId: user.entraId,
        });
        continue;
      }

      if (byEmail && byEmail.id) {
        stats.skippedCreate.push({
          kind: "email_conflict",
          entraId: user.entraId,
          email: user.email,
          existingUserId: byEmail.id,
        });
        continue;
      }

      if (byCuit && byCuit.id) {
        stats.skippedCreate.push({
          kind: "cuit_conflict",
          entraId: user.entraId,
          cuit: user.cuit,
          existingUserId: byCuit.id,
        });
        continue;
      }

      const created = await usersService.create({
        firstName: user.firstName || "User",
        lastName: user.lastName || "-",
        email: user.email,
        cuit: user.cuit,
        active: user.active,
        entraId: user.entraId,
      } as User);
      stats.created.push({
        kind: "created",
        entraId: user.entraId,
        userId: created?.id || "",
      });
    }
  }

  return { stats, seenEntraIds };
}

async function disableMissingUsers(seenEntraIds: Set<string>) {
  const userRepo = AppDataSource.getRepository(UserEntity);

  const activeUsers = await userRepo.find({ where: { active: true } });
  const toDisableIds: string[] = activeUsers
    .filter((u) => !!u.entraId && !seenEntraIds.has(u.entraId))
    .map((u) => u.id)
    .filter(Boolean) as string[];

  if (toDisableIds.length === 0) return;

  const CHUNK_SIZE = 1000;
  for (let i = 0; i < toDisableIds.length; i += CHUNK_SIZE) {
    const chunk = toDisableIds.slice(i, i + CHUNK_SIZE);
    await userRepo
      .createQueryBuilder()
      .update(UserEntity)
      .set({ active: false })
      .whereInIds(chunk)
      .execute();
  }
}

function printResult(stats: Stats) {
  if (VERBOSE) {
    for (const c of stats.created) {
      console.log(`ok:create entraId=${c.entraId} userId=${c.userId}`);
    }

    for (const u of stats.updated) {
      console.log(
        `ok:update entraId=${u.entraId} userId=${u.userId} changes=${u.changes}`,
      );
    }

    for (const c of stats.cannotUpdate) {
      switch (c.kind) {
        case "email_conflict":
          console.log(
            `skip:update email_conflict entraId=${c.entraId} email=${c.email} usedBy=${c.existingUserId}`,
          );
          break;
        case "cuit_conflict":
          console.log(
            `skip:update cuit_conflict entraId=${c.entraId} cuit=${c.cuit} usedBy=${c.existingUserId}`,
          );
          break;
      }
    }

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
    `summary created=${stats.created.length} updated=${stats.updated.length} cannot_update=${stats.cannotUpdate.length} skipped_create=${stats.skippedCreate.length}`,
  );
}

async function runSync() {
  const serviceFactory = new ServiceFactory(AppDataSource);
  const usersService = serviceFactory.createUsersService();
  const token = await getAccessToken();
  const graphUsers = await fetchAllUsers(token);

  const { stats, seenEntraIds } = await parseAndSyncUsers(
    graphUsers,
    usersService,
  );

  if (DISABLE_MISSING) {
    await disableMissingUsers(seenEntraIds);
  }

  printResult(stats);
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
