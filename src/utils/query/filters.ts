export function extractFilters<T>(
  query: Record<string, unknown>,
  allowedKeys?: (keyof T)[],
): Partial<T> {
  const filters: Partial<T> = {};
  const reservedKeys = new Set([
    "page",
    "limit",
    "offset",
    "search",
    "sortBy",
    "sortOrder",
  ]);

  for (const [key, value] of Object.entries(query)) {
    if (reservedKeys.has(key)) continue;
    if (typeof value !== "string") continue;
    if (allowedKeys && !allowedKeys.includes(key as keyof T)) continue;

    filters[key as keyof T] = value as T[keyof T];
  }

  return filters;
}

export function extractSearch(
  query: Record<string, unknown>,
): string | undefined {
  return typeof query.search === "string" ? query.search : undefined;
}
