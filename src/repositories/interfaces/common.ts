import { PermissionType, UserRoleEnum } from "../../utils/common";

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  limit: 10,
  offset: 0,
} as const;

/**
 * Pagination parameters for repository queries
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Resolve pagination parameters with defaults
 * @param pagination - Optional pagination parameters
 * @returns Resolved pagination with defaults applied
 */
export function resolvePagination(pagination?: PaginationParams) {
  return {
    limit: pagination?.limit ?? DEFAULT_PAGINATION.limit,
    offset: pagination?.offset ?? DEFAULT_PAGINATION.offset,
  };
}

/**
 * Permission filtering parameters for repository queries
 * When userId is provided with role USER, filters results based on user permissions
 */
export interface PermissionFilterParams {
  userId: string;
  userRole: UserRoleEnum;
  requiredPermission: PermissionType;
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
