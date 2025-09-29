// ISO date regex pattern - centralized to avoid duplication
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

/**
 * Validates if a string is a valid ISO 8601 date format
 * @param dateString The date string to validate
 * @returns true if valid, false otherwise
 */
export const isValidISODate = (dateString: string): boolean => {
  if (!ISO_DATE_REGEX.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validates ISO date format and throws error if invalid (for services)
 * @param dateString The date string to validate
 * @param paramName The parameter name for error messages
 * @throws Error if date format is invalid
 */
export const validateISODateFormat = (
  dateString: string,
  paramName: string,
): void => {
  if (!isValidISODate(dateString)) {
    throw new Error(`Invalid ${paramName} format. Expected ISO 8601 format.`);
  }
};
