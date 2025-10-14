import { Role } from "../../entities/Roles";
import { DeleteResult } from "typeorm";

export interface RolesSearchParams {
  permission?: string;
}

export interface RolesFindOptions {
  limit?: number;
  offset?: number;
  searchParams?: RolesSearchParams;
}

/**
 * Interface for Roles Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IRolesRepository {
  findAndCount(options?: RolesFindOptions): Promise<[Role[], number]>;
  findOne(id: string): Promise<Role | null>;
  create(data: Partial<Role>): Role;
  save(entity: Role): Promise<Role>;
  delete(id: string): Promise<DeleteResult>;
}
