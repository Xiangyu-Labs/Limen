import { encrypt as encryptSession } from '@/lib/auth/session';
import { dashboardPath, loginPath } from '@/lib/pathname';

type AuthActionDeps = {
  authPassword?: string;
  encrypt: typeof encryptSession;
  cookies: () => Promise<{
    set: (...args: any[]) => unknown;
  }>;
  redirect: (location: string) => never;
};

export function createAuthActions({
  authPassword = process.env.AUTH_PASSWORD,
  encrypt,
  cookies,
  redirect,
}: AuthActionDeps) {
  return {
    async login(formData: FormData) {
      const password = formData.get('password');

      if (password === authPassword) {
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const session = await encrypt({ expires });

        (await cookies()).set('session', session, { expires, httpOnly: true });
        redirect(dashboardPath());
      } else {
        return { error: 'Invalid password' };
      }
    },

    async logout() {
      (await cookies()).set('session', '', { expires: new Date(0) });
      redirect(loginPath());
    },
  };
}
