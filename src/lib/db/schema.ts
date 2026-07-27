import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import { normalizeToUtcDay } from '@/lib/entry-date';

export const entries = pgTable(
  'entries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    content: text('content').notNull(),
    title: text('title'),
    summary: text('summary'),
    tags: text('tags'), // JSON string of tags
    source: text('source').default('web'),
    aiStatus: text('ai_status').default('pending'),
    createdAt: date('created_at', { mode: 'date' })
      .notNull()
      .$defaultFn(() => normalizeToUtcDay(new Date())),
    recordedAt: timestamp('recorded_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).$defaultFn(() => new Date()),
  },
  (table) => [
    index('entries_timeline_idx').on(
      table.createdAt.desc(),
      table.recordedAt.desc(),
      table.id.desc(),
    ),
  ],
);

export const authAttempts = pgTable(
  'auth_attempts',
  {
    key: text('key').primaryKey(),
    failures: integer('failures').notNull().default(0),
    windowStartedAt: timestamp('window_started_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    blockedUntil: timestamp('blocked_until', {
      withTimezone: true,
      mode: 'date',
    }),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
  (table) => [index('auth_attempts_updated_at_idx').on(table.updatedAt)],
);
