'use client';

import { useState } from 'react';
import { login } from '@/lib/auth/actions';
import { Lock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function getLoginSubmitLabel(loading: boolean) {
  return loading ? 'Authenticating...' : 'Access Diary';
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
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface2 p-6 animate-in fade-in duration-500">
      <Card className="max-w-sm w-full p-2">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-text tracking-tight">Limen</h1>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Sign in to your private diary</p>
          </div>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Password
              </label>
              <Input
                name="password"
                type="password"
                required
                autoFocus
                className="h-12 text-center text-lg tracking-[0.5em]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-danger text-[10px] font-bold uppercase tracking-widest text-center bg-danger/10 py-3 rounded-md animate-in shake-2 duration-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-sm font-bold uppercase tracking-widest"
            >
              {getLoginSubmitLabel(loading)}
            </Button>
          </form>

          <p className="mt-8 text-center text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">
            Protected by End-to-End Encryption
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
