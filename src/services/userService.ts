import { oneOrNone, some } from "../db";
import { User } from "../interfaces/user";

const BASE_SELECT =
  "SELECT id, first_name AS firstName, last_name AS lastName, dni, email FROM users";

export const getAllUsers = async (): Promise<User[]> => {
  const sql = `${BASE_SELECT}`;
  return some<User>(sql);
};

export const getUserById = async (id: number): Promise<User | undefined> => {
  const sql = `${BASE_SELECT} WHERE id = $1`;
  const result = await oneOrNone<User>(sql, [id]);
  if (!result) {
    return undefined;
  }
  return result;
};

export const addUser = async (user: User): Promise<User | undefined> => {
  const { firstName, lastName, dni, email } = user;
  const sql = `INSERT INTO users (first_name, last_name, dni, email) VALUES ($1, $2, $3, $4) RETURNING *`;
  const params = [firstName, lastName, dni, email];
  const newUser = await oneOrNone<User>(sql, params);
  if (!newUser) {
    return undefined;
  }
  return newUser;
};
