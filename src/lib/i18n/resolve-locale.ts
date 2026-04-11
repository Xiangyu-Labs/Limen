import { defaultLocale, isLocale, type Locale } from './config';

type ResolveRequestLocaleInput = {
  pathname: string;
  cookieLocale: string | null;
  acceptLanguage: string | null;
};

function pickLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  for (const part of header.split(',')) {
    const [rawTag] = part.trim().split(';');
    const normalized = rawTag.toLowerCase();
    const base = normalized.split('-')[0];

    if (isLocale(base)) {
      return base;
    }
  }

  return null;
}

export function getPathLocale(pathname: string): Locale | null {
  const [, maybeLocale] = pathname.split('/');
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function resolveRequestLocale({
  pathname,
  cookieLocale,
  acceptLanguage,
}: ResolveRequestLocaleInput): Locale {
  const localeFromPath = getPathLocale(pathname);
  if (localeFromPath) {
    return localeFromPath;
  }

  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return pickLocaleFromAcceptLanguage(acceptLanguage) ?? defaultLocale;
}
