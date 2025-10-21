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
