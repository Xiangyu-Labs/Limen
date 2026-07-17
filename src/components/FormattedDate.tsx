import { formatAbsoluteDate } from '@/lib/format';

export function FormattedDate({ date, className }: { date: Date | null; className?: string }) {
  return <span className={className}>{date ? formatAbsoluteDate(date) : '未知'}</span>;
}

export { formatAbsoluteDate };
