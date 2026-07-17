import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { loginPath, stripLegacyLocalePath } from '@/lib/pathname';
import { secureStringEqual } from '@/lib/auth/security';

type ProxyDecisionInput = {
  pathname: string;
  hasSession: boolean;
  authHeader: string | null;
  authPassword: string | undefined;
};

type ProxyDecision =
  | { type: 'json'; status: number; body: { error: string } }
  | { type: 'redirect'; location: string }
  | { type: 'next' };

export function shouldBypassProxy(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

export function evaluateProxyRequest({
  pathname,
  hasSession,
  authHeader,
  authPassword,
}: ProxyDecisionInput): ProxyDecision {
  if (shouldBypassProxy(pathname)) return { type: 'next' };

  if (pathname.startsWith('/api/dashboard')) {
    return hasSession
      ? { type: 'next' }
      : { type: 'json', status: 401, body: { error: 'Unauthorized' } };
  }

  if (pathname.startsWith('/api')) {
    if (!authPassword || !authHeader?.startsWith('Bearer ') || !secureStringEqual(authHeader.slice(7), authPassword)) {
      return { type: 'json', status: 401, body: { error: 'Unauthorized' } };
    }
    return { type: 'next' };
  }

  const normalizedPath = stripLegacyLocalePath(pathname);
  if (normalizedPath !== pathname) return { type: 'redirect', location: normalizedPath };
  if (pathname === '/login') {
    return hasSession ? { type: 'redirect', location: '/' } : { type: 'next' };
  }
  if ((pathname === '/' || pathname.startsWith('/entries')) && !hasSession) {
    return { type: 'redirect', location: loginPath() };
  }
  return { type: 'next' };
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsSession = !pathname.startsWith('/api/') || pathname.startsWith('/api/dashboard');
  const hasSession = needsSession ? Boolean(await getSession()) : false;
  const decision = evaluateProxyRequest({
    pathname,
    hasSession,
    authHeader: request.headers.get('authorization'),
    authPassword: process.env.AUTH_PASSWORD,
  });

  if (decision.type === 'json') {
    return NextResponse.json(decision.body, { status: decision.status });
  }
  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.location, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
