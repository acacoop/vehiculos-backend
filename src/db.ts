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

// export const query = async (text: string, params?: unknown[]) => {
//   const result = await pool.query(text, params);
//   return result.rows;
// };

export const some = async <T>(
  text: string,
  params?: unknown[]
): Promise<T[]> => {
  try {
    const { rows } = await pool.query(text, params);
    return rows;
  } catch (error) {
    console.log(error);
    return [];
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
    console.log(error);
    return null;
  }
};
