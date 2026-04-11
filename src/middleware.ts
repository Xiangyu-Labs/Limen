import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { localeCookieName } from '@/lib/i18n/config';
import { loginPath, switchLocalePath } from '@/lib/i18n/pathname';
import { getPathLocale, resolveRequestLocale } from '@/lib/i18n/resolve-locale';

type MiddlewareDecisionInput = {
  pathname: string;
  hasSession: boolean;
  authHeader: string | null;
  authPassword: string | undefined;
  cookieLocale: string | null;
  acceptLanguage: string | null;
};

type MiddlewareDecision =
  | { type: 'json'; status: number; body: { error: string } }
  | { type: 'redirect'; location: string; setCookieLocale: 'en' | 'zh' }
  | { type: 'next' };

export function shouldBypassLocaleMiddleware(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export function normalizeLocaleRedirectTarget(pathname: string, locale: 'en' | 'zh') {
  return switchLocalePath(pathname, locale);
}

function hasInvalidLocalePrefix(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  const firstSegment = segments[0];
  // If it's a valid locale, it's not invalid
  if (firstSegment === 'en' || firstSegment === 'zh') return false;
  // If it looks like a locale code (2 letters), it's invalid
  if (/^[a-zA-Z]{2}$/.test(firstSegment)) return true;
  return false;
}

export function evaluateMiddlewareRequest({
  pathname,
  hasSession,
  authHeader,
  authPassword,
  cookieLocale,
  acceptLanguage,
}: MiddlewareDecisionInput): MiddlewareDecision {
  if (shouldBypassLocaleMiddleware(pathname)) {
    return { type: 'next' };
  }

  if (pathname.startsWith('/api')) {
    if (!authHeader || authHeader !== `Bearer ${authPassword}`) {
      return { type: 'json', status: 401, body: { error: 'Unauthorized' } };
    }

    return { type: 'next' };
  }

  // Let App Router handle invalid locale paths (e.g., /fr/dashboard)
  if (hasInvalidLocalePrefix(pathname)) {
    return { type: 'next' };
  }

  const locale = resolveRequestLocale({
    pathname,
    cookieLocale,
    acceptLanguage,
  });

  const pathLocale = getPathLocale(pathname);

  if (pathname === '/') {
    return {
      type: 'redirect',
      location: `/${locale}`,
      setCookieLocale: locale,
    };
  }

  if (!pathLocale) {
    return {
      type: 'redirect',
      location: normalizeLocaleRedirectTarget(pathname, locale),
      setCookieLocale: locale,
    };
  }

  if (pathname === `/${pathLocale}/login`) {
    if (hasSession) {
      return { type: 'redirect', location: `/${pathLocale}`, setCookieLocale: pathLocale };
    }

    return { type: 'next' };
  }

  if (pathname.startsWith(`/${pathLocale}/entries`) || pathname === `/${pathLocale}`) {
    if (!hasSession) {
      return {
        type: 'redirect',
        location: loginPath(pathLocale),
        setCookieLocale: pathLocale,
      };
    }
  }

  return { type: 'next' };
}

export async function middleware(request: NextRequest) {
  const authPassword = process.env.AUTH_PASSWORD;
  const pathname = request.nextUrl.pathname;
  const session = await getSession();
  const decision = evaluateMiddlewareRequest({
    pathname,
    hasSession: Boolean(session),
    authHeader: request.headers.get('Authorization'),
    authPassword,
    cookieLocale: request.cookies.get(localeCookieName)?.value ?? null,
    acceptLanguage: request.headers.get('accept-language'),
  });

  if (decision.type === 'json') {
    return new NextResponse(JSON.stringify(decision.body), {
      status: decision.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (decision.type === 'redirect') {
    const response = NextResponse.redirect(new URL(decision.location, request.url));
    response.cookies.set(localeCookieName, decision.setCookieLocale, { path: '/' });
    return response;
  }

  const locale = getPathLocale(pathname);
  if (!locale) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(localeCookieName, locale, { path: '/' });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
