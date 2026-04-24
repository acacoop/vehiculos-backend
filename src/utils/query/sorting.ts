import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { SortParams } from "@/repositories/interfaces/common";

/**
 * Field mapping for sorting operations.
 * Maps API field names to actual database column paths.
 *
 * @example
 * const vehicleSortFieldMapping: SortFieldMapping = {
 *   brand: "b.name",
 *   model: "m.name",
 *   licensePlate: "v.licensePlate",
 *   year: "v.year",
 * };
 */
export type SortFieldMapping = Record<string, string>;

/**
 * Validates that a sort field is allowed and returns the database column path.
 * @param sortBy - The API field name to sort by
 * @param fieldMapping - Mapping of API field names to database columns
 * @returns The database column path or null if not allowed
 */
export function validateSortField(
  sortBy: string,
  fieldMapping: SortFieldMapping,
): string | null {
  return fieldMapping[sortBy] ?? null;
}

/**
 * Validates that a field name is safe to use in SQL ORDER BY.
 * Only allows alphanumeric characters, underscores, and dots.
 * @throws Error if field name contains potentially dangerous characters
 */
function validateColumnPath(columnPath: string): void {
  const safePattern = /^[a-zA-Z0-9_.]+$/;
  if (!safePattern.test(columnPath)) {
    throw new Error(
      `Invalid column path: "${columnPath}". Column paths must only contain alphanumeric characters, underscores, and dots.`,
    );
  }
}

/**
 * Applies sorting to a query builder based on the provided sorting parameters.
 * If the sortBy field is not in the allowed field mapping, sorting is not applied.
 *
 * @param qb - The TypeORM SelectQueryBuilder to apply sorting to
 * @param sorting - The sorting parameters from the request
 * @param fieldMapping - Mapping of API field names to database column paths
 * @returns true if sorting was applied, false otherwise
 *
 * @example
 * const sorting = { sortBy: "licensePlate", sortOrder: "DESC" };
 * const fieldMapping = {
 *   brand: "b.name",
 *   model: "m.name",
 *   licensePlate: "v.licensePlate",
 * };
 *
 * const sortingApplied = applySorting(qb, sorting, fieldMapping);
 * if (!sortingApplied) {
 *   // Apply default ordering
 *   qb.orderBy("v.createdAt", "DESC");
 * }
 */
export function applySorting<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  sorting: SortParams | undefined,
  fieldMapping: SortFieldMapping,
  tieBreaker?: string,
): boolean {
  if (!sorting?.sortBy) {
    return false;
  }

  const columnPath = validateSortField(sorting.sortBy, fieldMapping);
  if (!columnPath) {
    return false;
  }

  // Validate column path to prevent SQL injection
  validateColumnPath(columnPath);

  const sortOrder = sorting.sortOrder ?? "ASC";
  qb.orderBy(columnPath, sortOrder);

  // Add deterministic tie-breaker for stable pagination
  if (tieBreaker) {
    validateColumnPath(tieBreaker);
    qb.addOrderBy(tieBreaker, "ASC");
  }

  return true;
}

/**
 * Extracts sorting parameters from query string.
 * If allowedSortFields is provided, validates that sortBy is in the allowed fields list.
 *
 * @param query - The request query object
 * @param allowedSortFields - Optional array of allowed field names for sorting
 * @returns SortParams object or undefined if not provided, if sortOrder is invalid, or if sortBy is not allowed when allowedSortFields is provided
 */
export function extractSorting(
  query: Record<string, unknown>,
  allowedSortFields?: string[],
): SortParams | undefined {
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : undefined;
  const sortOrderRaw =
    typeof query.sortOrder === "string"
      ? query.sortOrder.toUpperCase()
      : undefined;

  // Validate sortOrder is ASC or DESC
  const sortOrder: "ASC" | "DESC" | undefined =
    sortOrderRaw === "ASC" || sortOrderRaw === "DESC"
      ? sortOrderRaw
      : undefined;

  if (!sortBy) {
    return undefined;
  }

  // If allowedSortFields is provided, validate sortBy is in the list
  if (allowedSortFields && !allowedSortFields.includes(sortBy)) {
    return undefined;
  }

  return {
    sortBy,
    sortOrder,
  };
}
