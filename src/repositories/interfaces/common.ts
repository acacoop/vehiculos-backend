import { PermissionType } from "../../entities/PermissionType";
import { UserRoleEnum } from "../../entities/UserRoleEnum";

/**
 * Pagination parameters for repository queries
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Permission filtering parameters for repository queries
 * When userId is provided with role USER, filters results based on user permissions
 */
export interface PermissionFilterParams {
  userId?: string;
  userRole?: UserRoleEnum;
  requiredPermission?: PermissionType;
}

/**
 * Combined parameters for repository findAndCount operations
 * @template TSearchParams - Entity-specific search parameters (defaults to Record<string, unknown>)
 *
 * @example
 * // Vehicle repository
 * RepositoryFindOptions<VehicleSearchParams>
 *
 * // User repository
 * RepositoryFindOptions<UserSearchParams>
 */
export interface RepositoryFindOptions<
  TSearchParams = Record<string, unknown>,
> {
  pagination?: PaginationParams;
  permissions?: PermissionFilterParams;
  searchParams?: TSearchParams;
}
