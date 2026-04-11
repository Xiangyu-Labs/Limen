import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Locale } from '@/lib/i18n/config';

export function formatAbsoluteDate(locale: Locale, date: Date) {
  return format(date, 'PPP', {
    locale: locale === 'zh' ? zhCN : undefined,
  });
}
