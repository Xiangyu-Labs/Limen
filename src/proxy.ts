import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { loginPath, stripLegacyLocalePath } from '@/lib/pathname';
import { verifyApiToken } from '@/lib/auth/security';
import {
  applySecurityHeaders,
  buildContentSecurityPolicy,
  createRequestNonce,
} from '@/lib/auth/response-security';

type ProxyDecisionInput = {
  pathname: string;
  hasSession: boolean;
  authHeader: string | null;
  apiTokenHash: string | undefined;
};

type ProxyDecision =
  | { type: 'json'; status: number; body: { error: string } }
  | { type: 'redirect'; location: string }
  | { type: 'next' };

export function shouldBypassProxy(pathname: string) {
  return pathname.startsWith('/_next/static/')
    || pathname.startsWith('/_next/image/')
    || pathname === '/favicon.ico'
    || pathname === '/robots.txt';
}

export function evaluateProxyRequest({
  pathname,
  hasSession,
  authHeader,
  apiTokenHash,
}: ProxyDecisionInput): ProxyDecision {
  if (shouldBypassProxy(pathname)) return { type: 'next' };

  if (pathname.startsWith('/api/dashboard')) {
    return hasSession
      ? { type: 'next' }
      : { type: 'json', status: 401, body: { error: 'Unauthorized' } };
  }

  if (pathname.startsWith('/api')) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    return verifyApiToken(token, apiTokenHash)
      ? { type: 'next' }
      : { type: 'json', status: 401, body: { error: 'Unauthorized' } };
  }

  const normalizedPath = stripLegacyLocalePath(pathname);
  if (normalizedPath !== pathname) return { type: 'redirect', location: normalizedPath };
  if (pathname === '/login') {
    return hasSession ? { type: 'redirect', location: '/' } : { type: 'next' };
  }
  return hasSession ? { type: 'next' } : { type: 'redirect', location: loginPath() };
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (shouldBypassProxy(pathname)) return NextResponse.next();

  const needsSession = !pathname.startsWith('/api/') || pathname.startsWith('/api/dashboard');
  const decision = evaluateProxyRequest({
    pathname,
    hasSession: needsSession ? Boolean(await getSession()) : false,
    authHeader: request.headers.get('authorization'),
    apiTokenHash: process.env.API_TOKEN_HASH,
  });
  const nonce = createRequestNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  let response: NextResponse;
  if (decision.type === 'json') {
    response = NextResponse.json(decision.body, { status: decision.status });
  } else if (decision.type === 'redirect') {
    response = NextResponse.redirect(new URL(decision.location, request.url));
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  applySecurityHeaders(response.headers, contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
