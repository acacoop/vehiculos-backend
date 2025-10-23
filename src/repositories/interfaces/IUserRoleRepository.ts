import { UserRole } from "@/entities/UserRole";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

export interface UserRoleFilters {
  userId?: string;
  role?: UserRoleEnum;
  activeOnly?: boolean;
}

/**
 * Interface for UserRole Repository
 * This abstraction allows for easy mocking in tests
 */
export interface IUserRoleRepository {
  findAndCount(options?: {
    limit?: number;
    offset?: number;
    filters?: UserRoleFilters;
    search?: string;
  }): Promise<[UserRole[], number]>;
  findOne(id: string): Promise<UserRole | null>;
  findByUserId(userId: string): Promise<UserRole[]>;
  findActiveByUserId(userId: string): Promise<UserRole | null>;
  hasActiveRole(userId: string, role: UserRoleEnum): Promise<boolean>;
  create(data: Partial<UserRole>): UserRole;
  save(role: UserRole): Promise<UserRole>;
  saveMany(roles: UserRole[]): Promise<UserRole[]>;
  delete(id: string): Promise<{ affected?: number }>;
  endRole(id: string, endTime?: Date): Promise<UserRole | null>;
}
