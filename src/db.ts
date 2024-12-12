import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const query = async (text: string, params?: unknown[]) => {
  const result = await pool.query(text, params);
  return result.rows;
};

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
): Promise<T | undefined> => {
  try {
    const { rows } = await pool.query(text, params);
    return rows[0];
  } catch (error) {
    console.log(error);
    return undefined;
  }
};
