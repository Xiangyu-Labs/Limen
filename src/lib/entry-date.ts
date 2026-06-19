const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LEGACY_MINUTE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const LEGACY_SECOND_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const LEGACY_FRACTION_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/;

export function normalizeToUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatEntryDateForInput(date: Date | null) {
  return date ? normalizeToUtcDay(date).toISOString().slice(0, 10) : "";
}

export function parseEntryDateInput(input: string | null | undefined, now = new Date()) {
  const value = input?.trim();
  if (!value) {
    return normalizeToUtcDay(now);
  }

  const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  let parsed: Date;
  if (LEGACY_MINUTE_PATTERN.test(value)) {
    parsed = new Date(`${value}:00.000Z`);
  } else if (LEGACY_SECOND_PATTERN.test(value)) {
    parsed = new Date(`${value}.000Z`);
  } else if (LEGACY_FRACTION_PATTERN.test(value)) {
    parsed = new Date(`${value}Z`);
  } else {
    parsed = new Date(value);
  }

  if (Number.isNaN(parsed.getTime())) {
    return normalizeToUtcDay(now);
  }

  return normalizeToUtcDay(parsed);
}
