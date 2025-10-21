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
 * Combined parameters for repository findAndCount operations
 * @template TFilters - Entity-specific filter parameters (defaults to Record<string, unknown>)
 *
 * @example
 * // Vehicle repository
 * RepositoryFindOptions<VehicleFilters>
 *
 * // User repository
 * RepositoryFindOptions<UserFilters>
 */
export interface RepositoryFindOptions<TFilters = Record<string, string>> {
  pagination?: PaginationParams;
  filters?: TFilters;
  search?: string;
}
