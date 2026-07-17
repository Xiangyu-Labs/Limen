import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { loginPath, stripLegacyLocalePath } from '@/lib/pathname';

type MiddlewareDecisionInput = {
  pathname: string;
  hasSession: boolean;
  authHeader: string | null;
  authPassword: string | undefined;
};

type MiddlewareDecision =
  | { type: 'json'; status: number; body: { error: string } }
  | { type: 'redirect'; location: string }
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

export function evaluateMiddlewareRequest({
  pathname,
  hasSession,
  authHeader,
  authPassword,
}: MiddlewareDecisionInput): MiddlewareDecision {
  if (shouldBypassLocaleMiddleware(pathname)) {
    return { type: 'next' };
  }

  if (pathname.startsWith('/api')) {
    if (!authPassword || !authHeader || authHeader !== `Bearer ${authPassword}`) {
      return { type: 'json', status: 401, body: { error: 'Unauthorized' } };
    }

    return { type: 'next' };
  }

  const normalizedPath = stripLegacyLocalePath(pathname);
  if (normalizedPath !== pathname) {
    return { type: 'redirect', location: normalizedPath };
  }

  if (pathname === '/login') {
    if (hasSession) {
      return { type: 'redirect', location: '/' };
    }

    return { type: 'next' };
  }

  if (pathname === '/' || pathname.startsWith('/entries')) {
    if (!hasSession) {
      return { type: 'redirect', location: loginPath() };
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
  });

  if (decision.type === 'json') {
    return new NextResponse(JSON.stringify(decision.body), {
      status: decision.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.location, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
