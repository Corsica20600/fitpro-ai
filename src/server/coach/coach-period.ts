import type { CoachAnalysisPeriod } from "./coach-types";

const PARIS_TIME_ZONE = "Europe/Paris";
const ISO_WEEKDAYS: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

type CalendarDate = { year: number; month: number; day: number };

function parisParts(date: Date) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    dateParts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function parisWeekday(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TIME_ZONE,
    weekday: "short",
  }).format(date);
  return ISO_WEEKDAYS[weekday];
}

function addCalendarDays(date: CalendarDate, amount: number): CalendarDate {
  const utcDate = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function parisMidnightToUtc(date: CalendarDate) {
  const utcMidnight = Date.UTC(date.year, date.month - 1, date.day);
  const initial = new Date(utcMidnight);
  const offsetFromInitial = Date.UTC(
    parisParts(initial).year,
    parisParts(initial).month - 1,
    parisParts(initial).day,
    parisParts(initial).hour,
    parisParts(initial).minute,
    parisParts(initial).second,
  ) - utcMidnight;
  const candidate = new Date(utcMidnight - offsetFromInitial);
  const finalParts = parisParts(candidate);
  const finalOffset = Date.UTC(
    finalParts.year,
    finalParts.month - 1,
    finalParts.day,
    finalParts.hour,
    finalParts.minute,
    finalParts.second,
  ) - candidate.getTime();
  return new Date(utcMidnight - finalOffset);
}

function formatDateKey(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

/** Returns the four complete ISO calendar weeks immediately preceding the current Paris week. */
export function getLastFourCompletedCalendarWeeks(now = new Date()): CoachAnalysisPeriod {
  const parts = parisParts(now);
  const currentDate = { year: parts.year, month: parts.month, day: parts.day };
  const currentWeekStart = addCalendarDays(currentDate, 1 - parisWeekday(now));
  const periodEndDate = currentWeekStart;
  const periodStartDate = addCalendarDays(periodEndDate, -28);
  const nextAvailableDate = addCalendarDays(periodEndDate, 7);

  return {
    key: formatDateKey(periodEndDate),
    start: parisMidnightToUtc(periodStartDate),
    end: parisMidnightToUtc(periodEndDate),
    nextAvailableAt: parisMidnightToUtc(nextAvailableDate),
  };
}
