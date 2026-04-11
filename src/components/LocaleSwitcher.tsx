'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/config';
import { getLocaleLabel } from '@/lib/i18n/config';
import { switchLocalePath } from '@/lib/i18n/pathname';

interface LocaleSwitcherProps {
  locale: Locale;
}

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const [isPending] = useTransition();

  const otherLocale = locale === 'en' ? 'zh' : 'en';
  const targetPath = switchLocalePath(pathname, otherLocale);

  return (
    <Link
      href={targetPath}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider text-muted transition-colors hover:bg-surface2 hover:text-primary ${isPending ? 'opacity-50' : ''}`}
      aria-label={`Switch to ${getLocaleLabel(otherLocale)}`}
    >
      {locale === 'en' ? '中' : 'En'}
    </Link>
  );
}

// Keep the helper function for backward compatibility
type LegacyLocale = 'en' | 'zh';

export function getLocaleSwitchTarget(currentPath: string, nextLocale: LegacyLocale) {
  const url = new URL(currentPath, 'http://localhost');
  const pathname = url.pathname;
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'en' || segments[0] === 'zh') {
    segments[0] = nextLocale;
    return `/${segments.join('/')}${url.search}${url.hash}`;
  }

  if (pathname === '/' || pathname === '') {
    return `/${nextLocale}${url.search}${url.hash}`;
  }

  return `/${nextLocale}`;
}
