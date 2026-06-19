'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatAbsoluteDate } from '@/lib/format';

interface FormattedDateProps {
  date: Date;
  type?: 'relative' | 'full' | 'time';
  className?: string;
}

export function FormattedDate({ date, type = 'relative', className }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  let content = '';
  if (type === 'relative') {
    content = formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
  } else if (type === 'full') {
    content = formatAbsoluteDate(new Date(date));
  } else {
    content = format(new Date(date), 'p', { locale: zhCN });
  }

  return <span className={className}>{content}</span>;
}

export { formatAbsoluteDate };
