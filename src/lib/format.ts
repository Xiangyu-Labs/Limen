const absoluteDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});
const entryCalendarDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

export function formatAbsoluteDate(date: Date) {
  return absoluteDateFormatter.format(date);
}

export function formatEntryCalendarDate(date: Date) {
  return entryCalendarDateFormatter.format(date);
}

export function formatTimestampInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}
