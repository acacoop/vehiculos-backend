import { z } from "zod";

// Define the schema for the environment variables
// Coerce is used to convert the string to a number

const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default("postgres"),
  DB_PASSWORD: z.string().default("postgres"),
  DB_NAME: z.string().default("vehicles_db"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 1000), // 1 minute
  RATE_LIMIT_MAX: z.coerce.number().default(1000), // 1000 requests per window
  // Optional Entra tenant id (not required for Graph /me validation)
  ENTRA_TENANT_ID: z.string().optional(),
  // Sync script credentials (client credentials flow)
  ENTRA_CLIENT_ID: z.string().optional(),
  ENTRA_CLIENT_SECRET: z.string().optional(),
  ENTRA_GROUP_ID: z.string().optional(), // optional group to scope sync
});

const { success, error, data } = envSchema.safeParse(process.env);

if (!success) {
  console.error("Environment validation error:", error);
  process.exit(1);
}

export const { 
  APP_PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, 
  RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX,
  ENTRA_TENANT_ID,
  ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_GROUP_ID,
} = data;
