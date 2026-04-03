'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { encrypt } from '@/lib/auth/session';
import { createAuthActions } from './action-core';

const authActions = createAuthActions({
  encrypt,
  cookies,
  redirect,
});

export const login = authActions.login;
export const logout = authActions.logout;
