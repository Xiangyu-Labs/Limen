const absoluteDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatAbsoluteDate(date: Date) {
  return absoluteDateFormatter.format(date);
}
