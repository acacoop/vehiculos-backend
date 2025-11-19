export function parsePaginationQuery(query: {
  offset?: string;
  limit?: string;
}) {
  const offset = query.offset ? parseInt(query.offset) : 0;
  const limit = query.limit ? parseInt(query.limit) : 10;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;

  return { page, limit, offset };
}
