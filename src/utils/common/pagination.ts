/**
 * Pagination utilities
 */

/**
 * Parse pagination parameters from query and return concrete values with defaults
 */
export function parsePaginationQuery(query: { page?: string; limit?: string }) {
  const page = query.page ? parseInt(query.page) : 1;
  const limit = query.limit ? parseInt(query.limit) : 10;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}