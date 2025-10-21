const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

export const isValidISODate = (dateString: string): boolean => {
  if (!ISO_DATE_REGEX.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateISODateFormat = (
  dateString: string,
  paramName: string,
): void => {
  if (!isValidISODate(dateString)) {
    throw new Error(`Invalid ${paramName} format. Expected ISO 8601 format.`);
  }
};
