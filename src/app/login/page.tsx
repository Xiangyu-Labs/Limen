'use client';

import { type FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messages } from '@/lib/messages';
import { dashboardPath } from '@/lib/pathname';

export function getLoginSubmitLabel(loading: boolean) {
  return loading ? messages.login.submitLoading : messages.login.submitIdle;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await login(formData);
        if (!result.ok) {
          setError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success('登录成功');
        router.replace(dashboardPath());
        router.refresh();
      } catch {
        setError(messages.login.unexpectedError);
        toast.error(messages.login.unexpectedError);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <form onSubmit={submit} className="w-full max-w-xs space-y-5">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-text">Limen</h1>
        <div>
          <label htmlFor="login-password" className="sr-only">{messages.login.password}</label>
          <Input
            id="login-password"
            name="password"
            type="password"
            required
            minLength={14}
            maxLength={128}
            autoComplete="current-password"
            autoFocus
            disabled={isPending}
            className="h-12 text-center text-lg"
            placeholder="密码"
          />
        </div>
        {error ? (
          <div role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-center text-sm text-danger">
            {error}
          </div>
        ) : null}
        <Button type="submit" disabled={isPending} className="h-12 w-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {getLoginSubmitLabel(isPending)}
        </Button>
      </form>
    </div>
  );
}
