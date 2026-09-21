'use client';

import { Toaster } from 'sonner';
import type { Theme } from '@/lib/settings-core';

export function AppToaster({ theme }: { theme: Theme }) {
  return <Toaster position="top-center" theme={theme} richColors closeButton />;
}
