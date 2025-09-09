// UUID v4 regex pattern - centralized to avoid duplication
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 * @param id The UUID string to validate
 * @returns true if valid, false otherwise
 */
export const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

/**
 * Validates UUID format and throws error if invalid
 * @param id The UUID string to validate
 * @param paramName The parameter name for error messages
 * @throws Error if UUID format is invalid
 */
export const validateUUIDFormat = (
  id: string,
  paramName: string = "id"
): void => {
  if (!id) {
    throw new Error(`${paramName} parameter is required`);
  }

  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format for ${paramName}`);
  }
};
