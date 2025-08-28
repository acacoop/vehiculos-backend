import { AppDataSource } from "../db";
import { User as UserEntity } from "../entities/User";
import type { User } from "../types";
import { ILike } from "typeorm";

const repo = () => AppDataSource.getRepository(UserEntity);

export const getAllUsers = async (options?: {
  limit?: number;
  offset?: number;
  searchParams?: Record<string, string>;
}): Promise<{ items: User[]; total: number }> => {
  const { limit, offset, searchParams } = options || {};

  const where: Partial<Record<string, unknown>> = {};
  if (searchParams) {
    if (searchParams.email) where.email = searchParams.email;
    if (searchParams.dni) where.dni = Number(searchParams.dni);
    if (searchParams.firstName)
      where.firstName = ILike(`%${searchParams.firstName}%`);
    if (searchParams.lastName)
      where.lastName = ILike(`%${searchParams.lastName}%`);
    if (searchParams.active !== undefined)
      where.active = searchParams.active === "true";
  }

  const [items, total] = await repo().findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { lastName: "ASC" },
  });

  return { items: items.map(mapEntity), total };
};

export const getUserById = async (id: string): Promise<User | null> => {
  const entity = await repo().findOne({ where: { id } });
  return entity ? mapEntity(entity) : null;
};

export const getUserByEntraId = async (
  entraId: string,
): Promise<User | null> => {
  const entity = await repo().findOne({ where: { entraId } });
  return entity ? mapEntity(entity) : null;
};

export const addUser = async (user: User): Promise<User | null> => {
  const created = repo().create({
    firstName: user.firstName,
    lastName: user.lastName,
    dni: user.dni,
    email: user.email,
    active: user.active ?? true,
    entraId: user.entraId ?? null,
  });
  const saved = await repo().save(created);
  return mapEntity(saved);
};

export const updateUser = async (
  id: string,
  user: Partial<User>,
): Promise<User | null> => {
  const existing = await repo().findOne({ where: { id } });
  if (!existing) return null;
  Object.assign(existing, {
    firstName: user.firstName ?? existing.firstName,
    lastName: user.lastName ?? existing.lastName,
    dni: user.dni ?? existing.dni,
    email: user.email ?? existing.email,
    entraId: user.entraId ?? existing.entraId,
    active: user.active ?? existing.active,
  });
  const saved = await repo().save(existing);
  return mapEntity(saved);
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const res = await repo().delete(id);
  return res.affected === 1;
};

export const activateUser = async (id: string): Promise<User | null> => {
  const existing = await repo().findOne({ where: { id } });
  if (!existing) return null;
  if (existing.active) throw new Error("ALREADY_ACTIVE");
  existing.active = true;
  const saved = await repo().save(existing);
  return mapEntity(saved);
};

export const deactivateUser = async (id: string): Promise<User | null> => {
  const existing = await repo().findOne({ where: { id } });
  if (!existing) return null;
  if (!existing.active) throw new Error("ALREADY_INACTIVE");
  existing.active = false;
  const saved = await repo().save(existing);
  return mapEntity(saved);
};

function mapEntity(e: UserEntity): User {
  return {
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    dni: e.dni,
    email: e.email,
    active: e.active,
    entraId: e.entraId ?? undefined,
  };
}
