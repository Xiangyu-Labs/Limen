'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Locale } from '@/lib/i18n/config';
import { formatAbsoluteDate } from '@/lib/i18n/format';

interface FormattedDateProps {
  date: Date;
  locale?: Locale;
  type?: 'relative' | 'full' | 'time';
  className?: string;
}

function getDateFnsLocale(locale: Locale) {
  return locale === 'zh' ? zhCN : undefined;
}

export function FormattedDate({ date, locale = 'en', type = 'relative', className }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  let content = '';
  if (type === 'relative') {
    content = formatDistanceToNow(new Date(date), { addSuffix: true, locale: getDateFnsLocale(locale) });
  } else if (type === 'full') {
    content = formatAbsoluteDate(locale, new Date(date));
  } else {
    content = format(new Date(date), 'p', { locale: getDateFnsLocale(locale) });
  }

  return <span className={className}>{content}</span>;
}

export { formatAbsoluteDate };
