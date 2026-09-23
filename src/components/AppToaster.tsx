'use client';

import type { CSSProperties } from 'react';
import { Toaster } from 'sonner';
import type { Theme } from '@/lib/settings-core';

// Sonner reads these variables, so toasts pick up the app tokens instead of
// its own palette, and follow the theme without richColors' tinted fills.
const TOAST_TOKENS = {
  '--normal-bg': 'var(--surface)',
  '--normal-border': 'var(--border)',
  '--normal-text': 'var(--text)',
  '--border-radius': 'var(--radius-lg)',
} as CSSProperties;

export function AppToaster({ theme }: { theme: Theme }) {
  return (
    <Toaster
      position="top-center"
      theme={theme}
      closeButton
      style={TOAST_TOKENS}
    />
  );
}
