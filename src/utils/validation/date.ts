const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isValidISODate = (dateString: string): boolean => {
  if (!ISO_DATE_REGEX.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidDateOnly = (dateString: string): boolean => {
  if (!DATE_ONLY_REGEX.test(dateString)) {
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

export const validateDateOnlyFormat = (
  dateString: string,
  paramName: string,
): void => {
  if (!isValidDateOnly(dateString)) {
    throw new Error(`Invalid ${paramName} format. Expected YYYY-MM-DD format.`);
  }
};

export const validateEndDateAfterStartDate = (
  startDate: string,
  endDate: string,
): void => {
  if (new Date(endDate) <= new Date(startDate)) {
    throw new Error("End date must be after start date.");
  }
};
