import { encrypt as encryptSession } from '@/lib/auth/session';
import { dashboardPath, loginPath } from '@/lib/pathname';
import { secureStringEqual } from '@/lib/auth/security';

type AuthActionDeps = {
  authPassword?: string;
  encrypt: typeof encryptSession;
  cookies: () => Promise<{
    set: (name: string, value: string, options: Record<string, unknown>) => unknown;
  }>;
  redirect: (location: string) => never;
  cookieOptions?: (expires: Date) => Record<string, unknown>;
};

export function createAuthActions({
  authPassword = process.env.AUTH_PASSWORD,
  encrypt,
  cookies,
  redirect,
  cookieOptions = (expires) => ({ expires, httpOnly: true, sameSite: 'lax', path: '/' }),
}: AuthActionDeps) {
  return {
    async login(formData: FormData) {
      const password = formData.get('password');

      if (secureStringEqual(password, authPassword)) {
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const session = await encrypt({ expires });

        (await cookies()).set('session', session, cookieOptions(expires));
        redirect(dashboardPath());
      } else {
        return { error: 'Invalid password' };
      }
    },

    async logout() {
      (await cookies()).set('session', '', cookieOptions(new Date(0)));
      redirect(loginPath());
    },
  };
}
