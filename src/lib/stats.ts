export type WritingStatsInput = {
  totalEntries: number;
  totalCharacters: number;
  entriesThisYear: number;
  /** Distinct entry dates, newest first, as YYYY-MM-DD. */
  entryDates: string[];
};

export type WritingStats = {
  totalEntries: number;
  totalCharacters: number;
  entriesThisYear: number;
  currentStreak: number;
};

function toUtcDay(value: string) {
  return Date.parse(`${value}T00:00:00.000Z`);
}

const DAY_MS = 24 * 60 * 60 * 1_000;

/**
 * The current writing streak, counted back from today.
 *
 * Yesterday still counts as an unbroken streak, so opening the app before
 * writing does not show the streak already lost.
 */
export function computeCurrentStreak(entryDates: string[], today: string) {
  if (entryDates.length === 0) return 0;
  const days = [...new Set(entryDates)]
    .map(toUtcDay)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a);
  const todayValue = toUtcDay(today);
  const gapToLatest = (todayValue - days[0]) / DAY_MS;
  if (gapToLatest > 1) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if ((days[index - 1] - days[index]) / DAY_MS !== 1) break;
    streak += 1;
  }
  return streak;
}

export function computeWritingStats(
  input: WritingStatsInput,
  today: string,
): WritingStats {
  return {
    totalEntries: input.totalEntries,
    totalCharacters: input.totalCharacters,
    entriesThisYear: input.entriesThisYear,
    currentStreak: computeCurrentStreak(input.entryDates, today),
  };
}
