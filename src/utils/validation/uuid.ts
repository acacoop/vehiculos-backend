const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

export const validateUUIDFormat = (
  id: string,
  paramName: string = "id",
): void => {
  if (!id) {
    throw new Error(`${paramName} parameter is required`);
  }

  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format for ${paramName}`);
  }
};
