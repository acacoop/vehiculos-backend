import { User } from "../../entities/User";
import { DeleteResult } from "typeorm";
import { RepositoryFindOptions } from "./common";

export interface UserFilters {
  email?: string;
  cuit?: string;
  firstName?: string;
  lastName?: string;
  active?: string; // 'true' | 'false'
}

/**
 * Interface for User Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IUserRepository {
  findAndCount(
    opts?: RepositoryFindOptions<UserFilters>,
  ): Promise<[User[], number]>;
  findOne(id: string): Promise<User | null>;
  findByEntraId(entraId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCuit(cuit: string): Promise<User | null>;
  create(data: Partial<User>): User;
  save(entity: User): Promise<User>;
  delete(id: string): Promise<DeleteResult>;
}
