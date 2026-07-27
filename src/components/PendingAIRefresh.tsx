'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  AdaptiveAIPollingScheduler,
  AI_POLL_SWR_OPTIONS,
  TerminalAIStatusRefreshGuard,
  type AIStatus,
} from '@/lib/ai/polling';

type EntryStatusResponse = { aiStatus: AIStatus };

async function fetchEntryStatus(url: string): Promise<EntryStatusResponse> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('加载 AI 状态失败');
  return response.json();
}

export function PendingAIRefresh({ entryId }: { entryId: string }) {
  const router = useRouter();
  const pollingSchedulerRef = useRef<AdaptiveAIPollingScheduler | null>(null);
  const refreshGuardRef = useRef<TerminalAIStatusRefreshGuard | null>(null);
  pollingSchedulerRef.current ??= new AdaptiveAIPollingScheduler();
  refreshGuardRef.current ??= new TerminalAIStatusRefreshGuard();
  const pollingScheduler = pollingSchedulerRef.current;
  const refreshGuard = refreshGuardRef.current;

  useSWR<EntryStatusResponse>(
    `/api/dashboard/entries/${encodeURIComponent(entryId)}/status`,
    fetchEntryStatus,
    {
      fallbackData: { aiStatus: 'pending' },
      revalidateOnMount: false,
      refreshInterval: (latestData) =>
        pollingScheduler.getInterval(
          latestData?.aiStatus === 'pending' ? [entryId] : [],
        ),
      ...AI_POLL_SWR_OPTIONS,
      onError: () => pollingScheduler.recordFailure(),
      onSuccess: (latestData) => {
        pollingScheduler.recordSuccess();
        if (refreshGuard.shouldRefresh(latestData.aiStatus)) router.refresh();
      },
    },
  );

  return null;
}
