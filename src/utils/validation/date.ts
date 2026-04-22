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
    throw new Error(
      "End date must be after start date (exclusive interval: [start, end)).",
    );
  }
};

/**
 * Converts a Date object to a YYYY-MM-DD string using local time components.
 * Unlike toISOString().split("T")[0], this preserves the local date without UTC conversion.
 * @param date The Date object to convert
 * @returns A string in YYYY-MM-DD format representing the local date
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gets today's date as a YYYY-MM-DD string using local time.
 * @returns A string in YYYY-MM-DD format representing today's local date
 */
export const getTodayLocalDateString = (): string => {
  return toLocalDateString(new Date());
};
