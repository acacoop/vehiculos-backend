import { z } from "zod";

const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(1433),
  DB_USER: z.string().default("sa"),
  DB_PASSWORD: z.string().default("Your_password123"),
  DB_NAME: z.string().default("vehicles_db"),
  DB_LOGGING: z
    .enum(["true", "false"])
    .transform((v: string) => v === "true")
    .default("false"),
  AUTH_BYPASS: z
    .enum(["true", "false"])
    .transform((v: string) => v === "true")
    .default("false"),
  SQL_AAD_CONNECTION_STRING: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  ENTRA_TENANT_ID: z.string().optional(),
  ENTRA_CLIENT_ID: z.string().optional(),
  ENTRA_CLIENT_SECRET: z.string().optional(),
  ENTRA_GROUP_ID: z.string().optional(),
  ENTRA_API_AUDIENCE: z.string().optional(),
  ENTRA_ALLOWED_CLIENT_IDS: z.string().optional(),
  ENTRA_EXPECTED_ISSUER: z.string().optional(),
  ENTRA_REQUIRED_SCOPE: z.string().optional(),
  ADMIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Environment validation error:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const {
  APP_PORT,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_LOGGING,
  AUTH_BYPASS,
  SQL_AAD_CONNECTION_STRING,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  ENTRA_TENANT_ID,
  ENTRA_CLIENT_ID,
  ENTRA_CLIENT_SECRET,
  ENTRA_GROUP_ID,
  ENTRA_API_AUDIENCE,
  ENTRA_ALLOWED_CLIENT_IDS,
  ENTRA_EXPECTED_ISSUER,
  ENTRA_REQUIRED_SCOPE,
  ADMIN,
} = parsed.data;

export const SERVER_PORT =
  Number(process.env.PORT) ||
  Number(process.env.APP_PORT) ||
  Number(APP_PORT) ||
  3000;
