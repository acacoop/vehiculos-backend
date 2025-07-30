import { oneOrNone, some } from "../db";
import { User } from "../interfaces/user";

export const BASE_SELECT =
  'SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.dni, u.email, u.active FROM users u';

export const getAllUsers = async (options?: { 
  limit?: number; 
  offset?: number; 
  searchParams?: Record<string, string> 
}): Promise<{ items: User[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};
  
  // Build WHERE clause based on search parameters
  const whereConditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (searchParams) {
    if (searchParams.email) {
      whereConditions.push(`u.email = $${paramIndex++}`);
      params.push(searchParams.email);
    }
    if (searchParams.dni) {
      whereConditions.push(`u.dni = $${paramIndex++}`);
      params.push(searchParams.dni);
    }
    if (searchParams.firstName) {
      whereConditions.push(`LOWER(u.first_name) LIKE LOWER($${paramIndex++})`);
      params.push(`%${searchParams.firstName}%`);
    }
    if (searchParams.lastName) {
      whereConditions.push(`LOWER(u.last_name) LIKE LOWER($${paramIndex++})`);
      params.push(`%${searchParams.lastName}%`);
    }
    if (searchParams.active !== undefined) {
      whereConditions.push(`u.active = $${paramIndex++}`);
      params.push(searchParams.active === 'true');
    }
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM users u${whereClause}`;
  const countResult = await oneOrNone<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0');
  
  // Get paginated results
  let sql = `${BASE_SELECT}${whereClause}`;
  
  if (limit && offset !== undefined) {
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
  }
  
  const items = await some<User>(sql, params);
  
  return { items, total };
};

export const getUserById = async (id: string): Promise<User | null> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  return await oneOrNone<User>(sql, [id]);
};

export const addUser = async (user: User): Promise<User | null> => {
  const { firstName, lastName, dni, email, active = true } = user;

  const sql = `INSERT INTO users (first_name, last_name, dni, email, active) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name AS "firstName", last_name AS "lastName", dni, email, active`;
  const params = [firstName, lastName, dni, email, active];
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
  if (user.active !== undefined) {
    fields.push(`active = $${paramIndex++}`);
    params.push(user.active);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  params.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, first_name AS "firstName", last_name AS "lastName", dni, email, active`;
  
  return await oneOrNone<User>(sql, params);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const sql = `DELETE FROM users WHERE id = $1`;
  const result = await some(sql, [id]);
  return Array.isArray(result);
};

export const activateUser = async (id: string): Promise<User | null> => {
  // First check if user exists and get current state
  const currentUser = await getUserById(id);
  if (!currentUser) {
    return null;
  }
  
  // Check if user is already active
  if (currentUser.active) {
    throw new Error('ALREADY_ACTIVE');
  }
  
  const sql = `UPDATE users SET active = true WHERE id = $1 RETURNING id, first_name AS "firstName", last_name AS "lastName", dni, email, active`;
  return await oneOrNone<User>(sql, [id]);
};

export const deactivateUser = async (id: string): Promise<User | null> => {
  // First check if user exists and get current state
  const currentUser = await getUserById(id);
  if (!currentUser) {
    return null;
  }
  
  // Check if user is already inactive
  if (!currentUser.active) {
    throw new Error('ALREADY_INACTIVE');
  }
  
  const sql = `UPDATE users SET active = false WHERE id = $1 RETURNING id, first_name AS "firstName", last_name AS "lastName", dni, email, active`;
  return await oneOrNone<User>(sql, [id]);
};
