'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { encrypt, sessionCookieOptions } from '@/lib/auth/session';
import { createAuthActions } from './action-core';

const authActions = createAuthActions({
  encrypt,
  cookies,
  redirect,
  cookieOptions: sessionCookieOptions,
});

export type LoginState = { error?: string } | undefined;

export async function login(_state: LoginState, formData: FormData) {
  return authActions.login(formData);
}
export const logout = authActions.logout;
