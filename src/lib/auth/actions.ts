'use server';

import { after } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createAuthActions } from './action-core';
import { createLoginAttemptKey, verifyPassword } from './security';
import { createSession, SESSION_COOKIE_NAME, sessionCookieOptions, sessionExpiry } from './session';
import {
  cleanupLoginAttempts,
  clearLoginFailures,
  getLoginRateLimit,
  recordLoginFailure,
} from './rate-limit';

async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE_NAME, token, sessionCookieOptions(sessionExpiry()));
}

async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE_NAME, '', sessionCookieOptions(new Date(0)));
}

const authActions = createAuthActions({
  verifyPassword,
  getRateLimit: getLoginRateLimit,
  recordFailure: recordLoginFailure,
  clearFailures: clearLoginFailures,
  createSession,
  setSessionCookie,
  clearSessionCookie,
});

function loginKey(forwardedFor: string | null) {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error('SESSION_SECRET is required');
  return createLoginAttemptKey(forwardedFor, secret);
}

export async function login(formData: FormData) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-vercel-forwarded-for')
    ?? requestHeaders.get('x-forwarded-for');
  const result = await authActions.login(formData, loginKey(forwardedFor));
  after(() => cleanupLoginAttempts());
  return result;
}

export const logout = authActions.logout;
