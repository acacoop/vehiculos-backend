/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  limit: 10,
  offset: 0,
} as const;

/**
 * Default sorting values
 */
export const DEFAULT_SORT_ORDER = "ASC" as const;

/**
 * Pagination parameters for repository queries
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Sorting parameters for repository queries
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
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
 * Resolve sorting parameters with defaults
 * @param sorting - Optional sorting parameters
 * @returns Resolved sorting with defaults applied (sortOrder defaults to ASC)
 */
export function resolveSorting(sorting?: SortParams): SortParams {
  if (!sorting?.sortBy) {
    return {};
  }
  return {
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder ?? DEFAULT_SORT_ORDER,
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
  sorting?: SortParams;
}
