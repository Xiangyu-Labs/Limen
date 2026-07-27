import { cache } from 'react';
import { db } from '@/lib/db';
import { readSettings } from '@/lib/settings-core';

export const getSettings = cache(() => readSettings(db));
