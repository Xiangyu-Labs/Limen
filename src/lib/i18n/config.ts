export const locales = ['en', 'zh'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const localeCookieName = 'limen-locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'zh';
}

export function getLocaleLabel(locale: Locale) {
  return locale === 'zh' ? '中文' : 'English';
}
