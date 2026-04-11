import { type Locale } from './config';

function splitPathAndSuffix(input: string) {
  const hashIndex = input.indexOf('#');
  const queryIndex = input.indexOf('?');
  const cutIndex =
    hashIndex === -1
      ? queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(queryIndex, hashIndex);

  if (cutIndex === -1) {
    return { pathname: input, suffix: '' };
  }

  return {
    pathname: input.slice(0, cutIndex),
    suffix: input.slice(cutIndex),
  };
}

function stripLeadingLocale(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'en' || segments[0] === 'zh') {
    return '/' + segments.slice(1).join('/');
  }
  return pathname;
}

export function dashboardPath(locale: Locale) {
  return `/${locale}`;
}

export function loginPath(locale: Locale) {
  return `/${locale}/login`;
}

export function entryDetailPath(locale: Locale, id: string) {
  return `/${locale}/entries/${id}`;
}

export function entryEditPath(locale: Locale, id: string) {
  return `/${locale}/entries/${id}/edit`;
}

export function newEntryPath(locale: Locale) {
  return `/${locale}/entries/new`;
}

export function switchLocalePath(input: string, locale: Locale) {
  const { pathname, suffix } = splitPathAndSuffix(input);
  const normalizedPath = stripLeadingLocale(pathname);

  if (normalizedPath === '/' || normalizedPath === '') {
    return `${dashboardPath(locale)}${suffix}`;
  }

  if (normalizedPath === '/login' || normalizedPath.startsWith('/entries')) {
    return `/${locale}${normalizedPath}${suffix}`;
  }

  return `${dashboardPath(locale)}${suffix}`;
}
