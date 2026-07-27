'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { createSettingsActions } from '@/lib/settings-core';

const settingsActions = createSettingsActions({
  db,
  authorize: requireSession,
  revalidatePath,
});

export const saveSettings = settingsActions.saveSettings;
