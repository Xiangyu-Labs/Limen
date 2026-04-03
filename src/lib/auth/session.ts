import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

type CookieStore = {
  get: (name: string) => { value?: string } | undefined;
};

export function createSessionManager(secretKey = process.env.AUTH_PASSWORD || 'default_secret_key') {
  const key = new TextEncoder().encode(secretKey);

  return {
    async encrypt(payload: any) {
      return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(key);
    },

    async decrypt(input: string): Promise<any> {
      const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
      });
      return payload;
    },

    async getSession(cookieStore: CookieStore) {
      const session = cookieStore.get('session')?.value;
      if (!session) return null;
      return await this.decrypt(session);
    },

    async updateSession(request: any) {
      const session = request.cookies.get('session')?.value;
      if (!session) return;

      const parsed = await this.decrypt(session);
      parsed.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const res = NextResponse.next();
      res.cookies.set({
        name: 'session',
        value: await this.encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
      });
      return res;
    },
  };
}

const sessionManager = createSessionManager();

export const encrypt = sessionManager.encrypt.bind(sessionManager);
export const decrypt = sessionManager.decrypt.bind(sessionManager);

export async function getSession() {
  return await sessionManager.getSession(await cookies());
}

export async function updateSession(request: any) {
  return await sessionManager.updateSession(request);
}
