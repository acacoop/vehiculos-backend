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
});

const { success, error, data } = envSchema.safeParse(process.env);

if (!success) {
  console.error("Environment validation error:", error);
  process.exit(1);
}

export const { APP_PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } =
  data;
