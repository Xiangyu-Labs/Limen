import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatAbsoluteDate(date: Date) {
  return format(date, 'PPP', { locale: zhCN });
}
