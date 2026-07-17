'use client';

import { useActionState } from 'react';
import { login } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messages } from '@/lib/messages';

export function getLoginSubmitLabel(loading: boolean) {
  return loading ? messages.login.submitLoading : messages.login.submitIdle;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <form action={formAction} className="w-full max-w-xs space-y-5">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-text">Limen</h1>
        <div>
          <label htmlFor="login-password" className="sr-only">{messages.login.password}</label>
          <Input
            id="login-password"
            name="password"
            type="password"
            required
            autoFocus
            className="h-12 text-center text-lg tracking-[0.45em]"
            placeholder="••••••••"
          />
        </div>
        {state?.error ? (
          <div role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-center text-sm text-danger">
            {state.error}
          </div>
        ) : null}
        <Button type="submit" disabled={isPending} className="h-12 w-full">
          {getLoginSubmitLabel(isPending)}
        </Button>
      </form>
    </div>
  );
}
