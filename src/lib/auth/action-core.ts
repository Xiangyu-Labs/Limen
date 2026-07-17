import type { ActionResult } from '@/lib/actions/result';

type LoginLimit = { blocked: boolean; retryAfterSeconds: number };

type AuthActionDeps = {
  passwordHash?: string;
  verifyPassword: (password: unknown, encodedHash: string | undefined) => Promise<boolean>;
  getRateLimit: (key: string) => Promise<LoginLimit>;
  recordFailure: (key: string) => Promise<LoginLimit & { failures: number }>;
  clearFailures: (key: string) => Promise<void>;
  createSession: () => Promise<string>;
  setSessionCookie: (token: string) => Promise<void>;
  clearSessionCookie: () => Promise<void>;
};

const INVALID_LOGIN_MESSAGE = '密码错误或请求过于频繁';

export function createAuthActions({
  passwordHash = process.env.AUTH_PASSWORD_HASH,
  verifyPassword,
  getRateLimit,
  recordFailure,
  clearFailures,
  createSession,
  setSessionCookie,
  clearSessionCookie,
}: AuthActionDeps) {
  return {
    async login(formData: FormData, clientKey: string): Promise<ActionResult> {
      const limit = await getRateLimit(clientKey);
      if (limit.blocked) {
        return { ok: false, error: INVALID_LOGIN_MESSAGE, retryAfterSeconds: limit.retryAfterSeconds };
      }

      if (!await verifyPassword(formData.get('password'), passwordHash)) {
        const failed = await recordFailure(clientKey);
        return {
          ok: false,
          error: INVALID_LOGIN_MESSAGE,
          retryAfterSeconds: failed.blocked ? failed.retryAfterSeconds : undefined,
        };
      }

      await clearFailures(clientKey);
      await setSessionCookie(await createSession());
      return { ok: true, data: undefined };
    },

    async logout(): Promise<ActionResult> {
      await clearSessionCookie();
      return { ok: true, data: undefined };
    },
  };
}
