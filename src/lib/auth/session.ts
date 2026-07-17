import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

type CookieStore = {
  get: (name: string) => { value?: string } | undefined;
};

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export function createSessionManager(secretKey: string) {
  if (!secretKey) throw new Error('Session secret is required');
  const key = new TextEncoder().encode(secretKey);

  return {
    async encrypt(payload: JWTPayload) {
      return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(key);
    },

    async decrypt(input: string): Promise<JWTPayload> {
      const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
      });
      return payload;
    },

    async getSession(cookieStore: CookieStore) {
      const session = cookieStore.get('session')?.value;
      if (!session) return null;
      try {
        return await this.decrypt(session);
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
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters');
  }
  runtimeManager = createSessionManager(secret);
  return runtimeManager;
}

export async function encrypt(payload: Record<string, unknown>) {
  return getRuntimeManager().encrypt(payload);
}

export async function decrypt(input: string) {
  return getRuntimeManager().decrypt(input);
}

export async function getSession() {
  const cookieStore = await cookies();
  return getRuntimeManager().getSession(cookieStore);
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
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}
