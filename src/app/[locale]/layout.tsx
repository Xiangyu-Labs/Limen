import { notFound } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import { isLocale } from '@/lib/i18n/config';

export function assertLocale(locale: string): Locale {
  if (!isLocale(locale)) {
    notFound();
  }

  return locale;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = assertLocale(locale);

  return <html lang={resolvedLocale}><body className="antialiased">{children}</body></html>;
}
