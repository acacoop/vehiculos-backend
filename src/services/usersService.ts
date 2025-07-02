import { oneOrNone, some } from "../db";
import { User } from "../interfaces/user";

export const BASE_SELECT =
  "SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.dni, u.email FROM users u";

export const getAllUsers = async (options?: { limit?: number; offset?: number }): Promise<{ items: User[]; total: number }> => {
  const { limit, offset } = options || {};
  
  // Get total count
  const countSql = "SELECT COUNT(*) as total FROM users";
  const countResult = await oneOrNone<{ total: string }>(countSql);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = BASE_SELECT;
  const params: unknown[] = [];
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $1 OFFSET $2`;
    params.push(limit, offset);
  }
  
  const items = await some<User>(sql, params);
  
  return { items, total };
};

export const getUserById = async (id: string): Promise<User | null> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<User>(sql, [id]);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const sql = `${BASE_SELECT} WHERE email = $1`;
  return await oneOrNone<User>(sql, [email]);
};

export const getUserByDni = async (dni: string): Promise<User | null> => {
  const sql = `${BASE_SELECT} WHERE dni = $1`;
  return await oneOrNone<User>(sql, [dni]);
};

export const addUser = async (user: User): Promise<User | null> => {
  const { firstName, lastName, dni, email } = user;

  const sql = `INSERT INTO users (first_name, last_name, dni, email) VALUES ($1, $2, $3, $4) RETURNING id, first_name AS firstName, last_name AS lastName, dni, email`;
  const params = [firstName, lastName, dni, email];
  return await oneOrNone<User>(sql, params);
};

export const updateUser = async (id: string, user: Partial<User>): Promise<User | null> => {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (user.firstName !== undefined) {
    fields.push(`first_name = $${paramIndex++}`);
    params.push(user.firstName);
  }
  if (user.lastName !== undefined) {
    fields.push(`last_name = $${paramIndex++}`);
    params.push(user.lastName);
  }
  if (user.dni !== undefined) {
    fields.push(`dni = $${paramIndex++}`);
    params.push(user.dni);
  }
  if (user.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    params.push(user.email);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  params.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, first_name AS firstName, last_name AS lastName, dni, email`;
  
  return await oneOrNone<User>(sql, params);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM users WHERE id = $1`;
  const result = await some(sql, [id]);
  return Array.isArray(result);
};
