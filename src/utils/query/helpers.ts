import { Brackets, ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type SearchFilterField = string | string[];

/**
 * Validates that a field name is safe to use in SQL queries.
 * Only allows alphanumeric characters, underscores, dots, and brackets.
 * @throws Error if field name contains potentially dangerous characters
 */
function validateFieldName(fieldName: string): void {
  // Allow: letters, numbers, underscore, dot, square brackets (for table aliases)
  const safePattern = /^[a-zA-Z0-9_.\[\]]+$/;
  if (!safePattern.test(fieldName)) {
    throw new Error(
      `Invalid field name: "${fieldName}". Field names must only contain alphanumeric characters, underscores, dots, and brackets.`,
    );
  }
}

export function applySearchFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  searchTerm: string,
  fields: SearchFilterField[],
): void {
  if (!searchTerm || fields.length === 0) return;

  qb.andWhere(
    new Brackets((qb) => {
      fields.forEach((field, index) => {
        let condition: string;
        if (Array.isArray(field)) {
          // Validate all field names to prevent SQL injection
          field.forEach(validateFieldName);
          const concatFields = field.join(", ' ', ");
          condition = `CONCAT(${concatFields}) LIKE :search_term`;
        } else {
          // Validate field name to prevent SQL injection
          validateFieldName(field);
          condition = `${field} LIKE :search_term`;
        }

        if (index === 0) {
          qb.where(condition, {
            search_term: `%${searchTerm}%`,
          });
        } else {
          qb.orWhere(condition, {
            search_term: `%${searchTerm}%`,
          });
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
