import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_ISSUER = 'limen';
const SESSION_AUDIENCE = 'limen-web';
const SESSION_SUBJECT = 'owner';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
/**
 * Re-sign a session once it has less than this left.
 *
 * Without renewal the cookie is a hard 7-day timer, so someone writing every
 * day still gets logged out every week for no reason. Renewing only in the
 * last third keeps the number of re-signs low.
 */
export const SESSION_RENEW_THRESHOLD_SECONDS = 3 * 24 * 60 * 60;

export function shouldRenewSession(
  payload: { exp?: number } | null | undefined,
  now = new Date(),
) {
  if (!payload?.exp) return false;
  const remaining = payload.exp - Math.floor(now.getTime() / 1_000);
  return remaining > 0 && remaining < SESSION_RENEW_THRESHOLD_SECONDS;
}
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Host-limen-session'
    : 'limen-session';

type CookieStore = {
  get: (name: string) => { value?: string } | undefined;
};

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

function validateSessionSecret(secretKey: string) {
  if (!secretKey) throw new Error('AUTH_PASSWORD is required');
}

export function createSessionManager(secretKey: string) {
  validateSessionSecret(secretKey);
  const key = new TextEncoder().encode(secretKey);

  return {
    async create() {
      return new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(SESSION_ISSUER)
        .setAudience(SESSION_AUDIENCE)
        .setSubject(SESSION_SUBJECT)
        .setJti(randomUUID())
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
        .sign(key);
    },

    async verify(input: string) {
      const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
        subject: SESSION_SUBJECT,
      });
      return payload;
    },

    async getSession(cookieStore: CookieStore) {
      const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (!session) return null;
      try {
        return await this.verify(session);
      } catch {
        return null;
      }
    },
  };
}

let runtimeManager: ReturnType<typeof createSessionManager> | undefined;

function getRuntimeManager() {
  if (runtimeManager) return runtimeManager;
  const secret = process.env.AUTH_PASSWORD;
  if (!secret) throw new Error('AUTH_PASSWORD is required');
  runtimeManager = createSessionManager(secret);
  return runtimeManager;
}

export async function createSession() {
  return getRuntimeManager().create();
}

export async function getSession() {
  return getRuntimeManager().getSession(await cookies());
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export function sessionCookieOptions(expires: Date) {
  return {
    expires,
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    priority: 'high' as const,
  };
}

export function sessionExpiry(now = new Date()) {
  return new Date(now.getTime() + SESSION_DURATION_SECONDS * 1_000);
}
