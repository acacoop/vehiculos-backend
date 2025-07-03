import { Pool } from "pg";
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} from "./config/env.config";

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

pool.connect()
  .then(client => {
    console.log("✅ Database connection successful");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

export const some = async <T>(
  text: string,
  params?: unknown[]
): Promise<T[]> => {
  try {
    const { rows } = await pool.query(text, params);
    return rows;
  } catch (error) {
    console.error("❌ Database query error in 'some':", error);
    throw error; // Re-throw to see the actual error
  }
};

export const oneOrNone = async <T>(
  text: string,
  params?: unknown[]
): Promise<T | null> => {
  try {
    const { rows } = await pool.query(text, params);
    return rows[0];
  } catch (error) {
    console.error("❌ Database query error in 'oneOrNone':", error);
    throw error; // Re-throw to see the actual error
  }
};
