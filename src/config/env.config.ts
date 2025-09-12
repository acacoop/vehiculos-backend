import { z } from "zod";

// Environment variable schema & export. Keep this in sync with .env.example documentation.
const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(1433),
  DB_USER: z.string().default("sa"),
  DB_PASSWORD: z.string().default("Your_password123"),
  DB_NAME: z.string().default("vehicles_db"),
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
} = parsed.data;

export const SERVER_PORT =
  Number(process.env.PORT) || // inyectado por Azure (8080)
  Number(process.env.APP_PORT) ||
  Number(APP_PORT) || // el de tu schema zod
  3000;

console.log(
  `[boot] PORT=${process.env.PORT ?? "(unset)"} APP_PORT=${APP_PORT} -> SERVER_PORT=${SERVER_PORT}`,
);
