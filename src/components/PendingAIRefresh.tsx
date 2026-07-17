'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AI_POLL_INTERVAL_MS, shouldPollPendingAI } from '@/lib/ai/polling';

export function PendingAIRefresh() {
  const router = useRouter();

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (!shouldPollPendingAI(true, startedAt, Date.now())) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, AI_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [router]);

  return null;
}
