'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatAbsoluteDate } from '@/lib/format';

interface FormattedDateProps {
  date: Date;
  type?: 'relative' | 'full';
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
  } else {
    content = formatAbsoluteDate(new Date(date));
  }

  return <span className={className}>{content}</span>;
}

export { formatAbsoluteDate };
