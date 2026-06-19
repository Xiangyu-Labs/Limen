'use client';

import { useState } from 'react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { login } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messages } from '@/lib/messages';

export function getLoginSubmitLabel(loading: boolean) {
  return loading ? messages.login.submitLoading : messages.login.submitIdle;
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      setError(messages.login.unexpectedError);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <form action={handleSubmit} className="w-full max-w-xs space-y-5">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-text">Limen</h1>

        <div>
          <label className="sr-only">{messages.login.password}</label>
          <Input
            name="password"
            type="password"
            required
            autoFocus
            className="h-12 text-center text-lg tracking-[0.45em]"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-center text-sm text-danger">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full"
        >
          {getLoginSubmitLabel(loading)}
        </Button>
      </form>
    </div>
  );
}
