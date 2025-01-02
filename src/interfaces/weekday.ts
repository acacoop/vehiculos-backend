export const WEEK_DAY_SEPARATOR = ",";

export enum WeekDay {
  SUNDAY = 1,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}

export const parseStringToWeekDays = (weekDays: string): Set<WeekDay> => {
  const weekDaysArray = weekDays
    .split(WEEK_DAY_SEPARATOR)
    .map((day) => parseInt(day));
  return new Set(weekDaysArray);
};

export const parseWeekDaysToString = (weekDays: Set<WeekDay>): string => {
  return Array.from(weekDays).join(WEEK_DAY_SEPARATOR);
};
