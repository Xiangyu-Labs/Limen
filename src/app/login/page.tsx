'use client';

import { useActionState, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { login } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messages } from '@/lib/messages';
import type { ActionResult } from '@/lib/actions/result';

export function getLoginSubmitLabel(loading: boolean) {
  return loading ? messages.login.submitLoading : messages.login.submitIdle;
}

export function formatRetryCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function LoginFields({
  state,
  isPending,
}: {
  state: ActionResult | undefined;
  isPending: boolean;
}) {
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(() =>
    state && !state.ok ? (state.retryAfterSeconds ?? 0) : 0,
  );
  const blocked = retryAfterSeconds > 0;

  useEffect(() => {
    if (!blocked) return;
    const timer = window.setInterval(
      () => setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [blocked]);

  const error = blocked
    ? messages.login.rateLimited(formatRetryCountdown(retryAfterSeconds))
    : state && !state.ok
      ? state.error
      : undefined;

  return (
    <>
      <div>
        <label htmlFor="login-password" className="sr-only">
          {messages.login.password}
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          disabled={isPending || blocked}
          className="h-12 text-center text-lg"
          placeholder="密码"
        />
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-md bg-danger/10 px-3 py-2 text-center text-sm text-danger"
        >
          {error}
        </div>
      ) : null}
      <Button
        type="submit"
        disabled={isPending || blocked}
        className="h-12 w-full"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {getLoginSubmitLabel(isPending)}
      </Button>
    </>
  );
}

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined);
  const retryAfterSeconds =
    state && !state.ok ? (state.retryAfterSeconds ?? 0) : 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <form action={action} className="w-full max-w-xs space-y-5">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-text">
          Limen
        </h1>
        <LoginFields
          key={retryAfterSeconds}
          state={state}
          isPending={isPending}
        />
      </form>
    </div>
  );
}
