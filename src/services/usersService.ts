import { oneOrNone, some } from "../db";
import { User } from "../interfaces/user";

export const BASE_SELECT =
  "SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.dni, u.email FROM users u";

export const getAllUsers = async (): Promise<User[]> => {
  const sql = `${BASE_SELECT}`;
  return some<User>(sql);
};

export const getUserById = async (id: number): Promise<User | null> => {
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
  const sql = `INSERT INTO users (first_name, last_name, dni, email) VALUES ($1, $2, $3, $4) RETURNING *`;
  const params = [firstName, lastName, dni, email];
  return await oneOrNone<User>(sql, params);
};
