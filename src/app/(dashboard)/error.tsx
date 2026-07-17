'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center text-center">
      <AlertCircle className="h-6 w-6 text-danger" />
      <p className="mt-3 text-sm text-muted">加载失败，请重试</p>
      <Button type="button" variant="secondary" onClick={reset} className="mt-4">
        <RefreshCw className="h-4 w-4" />
        重试
      </Button>
    </div>
  );
}
