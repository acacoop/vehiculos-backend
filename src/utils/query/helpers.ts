import { Brackets, ObjectLiteral, SelectQueryBuilder } from "typeorm";

export function applySearchFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  search: string,
  fields: string[],
): void {
  if (!search || fields.length === 0) return;

  qb.andWhere(
    new Brackets((qb) => {
      fields.forEach((field, index) => {
        if (index === 0) {
          qb.where(`${field} LIKE :search`, { search: `%${search}%` });
        } else {
          qb.orWhere(`${field} LIKE :search`, { search: `%${search}%` });
        }
      });
    }),
  );
}

export function applyFilters<
  T extends ObjectLiteral,
  TFilters = Record<string, string>,
>(
  qb: SelectQueryBuilder<T>,
  filters: TFilters,
  fieldMappings: {
    [K in keyof TFilters]: {
      field: string;
      operator?: "=" | "LIKE" | ">" | "<" | ">=" | "<=";
      transform?: (value: TFilters[K]) => unknown;
    };
  },
): void {
  if (!filters) return;

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;

    const mapping = fieldMappings[key as keyof TFilters];
    if (!mapping) return;

    const { field, operator = "=", transform } = mapping;
    const transformedValue = transform
      ? transform(value as TFilters[keyof TFilters])
      : value;
    const paramName = key.replace(/\./g, "_");

    if (operator === "LIKE") {
      qb.andWhere(`${field} LIKE :${paramName}`, {
        [paramName]: `%${transformedValue}%`,
      });
    } else {
      qb.andWhere(`${field} ${operator} :${paramName}`, {
        [paramName]: transformedValue,
      });
    }
  });
}

/**
 * Options for overlap validation query
 */
export interface OverlapCheckOptions {
  /** The entity ID to check overlaps for (e.g., vehicleId, userId) */
  entityId: string;
  /** The field name for the entity ID (e.g., "vehicle.id", "user.id") */
  entityField: string;
  /** Start date/time of the range to check */
  startDate: Date | string;
  /** End date/time of the range to check (null means no end) */
  endDate: Date | string | null;
  /** Optional ID to exclude from the check (for updates) */
  excludeId?: string;
  /** Additional filters to apply (e.g., { role: "admin" }) */
  additionalFilters?: Record<string, string | number | boolean | null>;
  /** Field name for start date/time (default: "startDate") */
  startField?: string;
  /** Field name for end date/time (default: "endDate") */
  endField?: string;
  /** Field name for ID (default: "id") */
  idField?: string;
}

/**
 * Apply overlap validation query to check for conflicting date/time ranges
 * @param qb - The query builder
 * @param options - Configuration options for the overlap check
 */
export function applyOverlapCheck<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  options: OverlapCheckOptions,
): void {
  const {
    entityId,
    entityField,
    startDate,
    endDate,
    excludeId,
    additionalFilters = {},
    startField = "startDate",
    endField = "endDate",
    idField = "id",
  } = options;

  // Main entity filter
  qb.where(`${entityField} = :entityId`, { entityId });

  // Exclude specific ID if provided (for updates)
  if (excludeId) {
    qb.andWhere(`${idField} != :excludeId`, { excludeId });
  }

  // Additional filters (e.g., role for user roles)
  Object.entries(additionalFilters).forEach(([field, value]) => {
    const paramName = field.replace(/\./g, "_");
    qb.andWhere(`${field} = :${paramName}`, { [paramName]: value });
  });

  // Check for overlap: ranges overlap if start1 < end2 AND end1 > start2
  // When end is null, it means no end (infinite), so:
  // - If checking endDate is null: startField < endDate is always false, but we need to check other conditions
  // - If existing endField is null: endField > startDate is always true
  // Simplified: (startField < :endDate OR :endDate IS NULL) AND (endField > :startDate OR endField IS NULL)
  qb.andWhere(
    `(${startField} < :endDate OR :endDate IS NULL) AND (${endField} > :startDate OR ${endField} IS NULL)`,
    { startDate, endDate },
  );
}

/**
 * Legacy function for backward compatibility - DEPRECATED
 * Use applyOverlapCheck with options object instead
 * @deprecated Use applyOverlapCheck(options) instead
 */
export function applyOverlapCheckLegacy<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  vehicleId: string,
  startDate: Date | string,
  endDate: Date | string | null,
  excludeId?: string,
  vehicleField: string = "vehicle.id",
  startField: string = "startDate",
  endField: string = "endDate",
  idField: string = "id",
): void {
  applyOverlapCheck(qb, {
    entityId: vehicleId,
    entityField: vehicleField,
    startDate,
    endDate,
    excludeId,
    startField,
    endField,
    idField,
  });
}

/**
 * Apply active filter for date ranges
 * Active means: startField <= targetDate AND (endField IS NULL OR endField >= targetDate)
 * @param qb - The query builder
 * @param targetDate - The date-only string (YYYY-MM-DD) to check activity for (defaults to current date)
 * @param startField - Field name for start date (default: "startDate")
 * @param endField - Field name for end date (default: "endDate")
 */
export function applyActiveFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  targetDate?: string,
  startField: string = "startDate",
  endField: string = "endDate",
): void {
  const date = targetDate || new Date().toISOString();
  qb.andWhere(
    `(${startField} <= :activeDate AND (${endField} IS NULL OR ${endField} >= :activeDate))`,
    { activeDate: date },
  );
}
