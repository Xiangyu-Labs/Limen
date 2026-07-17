import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_ISSUER = 'limen';
const SESSION_AUDIENCE = 'limen-web';
const SESSION_SUBJECT = 'owner';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_COOKIE_NAME = process.env.NODE_ENV === 'production'
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
  if (Buffer.byteLength(secretKey, 'utf8') < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes');
  }
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
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error('SESSION_SECRET is required');
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
