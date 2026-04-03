'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

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
    content = formatDistanceToNow(new Date(date), { addSuffix: true });
  } else if (type === 'full') {
    content = format(new Date(date), 'PPP');
  } else {
    content = format(new Date(date), 'p');
  }

  return <span className={className}>{content}</span>;
}
