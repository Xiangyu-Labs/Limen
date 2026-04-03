import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

type MiddlewareDecisionInput = {
  pathname: string;
  hasSession: boolean;
  authHeader: string | null;
  authPassword: string | undefined;
};

export function evaluateMiddlewareRequest({
  pathname,
  hasSession,
  authHeader,
  authPassword,
}: MiddlewareDecisionInput) {
  if (pathname.startsWith('/api')) {
    if (!authHeader || authHeader !== `Bearer ${authPassword}`) {
      return { type: 'json' as const, status: 401, body: { error: 'Unauthorized' } };
    }
  }

  if (pathname === '/' || pathname.startsWith('/entries')) {
    if (!hasSession) {
      return { type: 'redirect' as const, location: '/login' };
    }
  }

  if (pathname === '/login') {
    if (hasSession) {
      return { type: 'redirect' as const, location: '/' };
    }
  }

  return { type: 'next' as const };
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
    return new NextResponse(
      JSON.stringify(decision.body),
      { status: decision.status, headers: { 'content-type': 'application/json' } }
    );
  }

  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.location, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
