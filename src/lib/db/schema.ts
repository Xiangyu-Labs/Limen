import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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
    })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('entries_timeline_idx').on(
      table.createdAt.desc(),
      table.recordedAt.desc(),
      table.id.desc(),
    ),
    index('entries_ai_status_updated_at_idx').on(
      table.aiStatus,
      table.updatedAt,
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

export const settings = pgTable(
  'settings',
  {
    ownerId: text('owner_id').primaryKey(),
    theme: text('theme').notNull().default('system'),
    timeZone: text('time_zone').notNull().default('Asia/Shanghai'),
    editorFontSize: text('editor_font_size').notNull().default('medium'),
    defaultExportFormat: text('default_export_format')
      .notNull()
      .default('markdown'),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'settings_theme_check',
      sql`${table.theme} IN ('system', 'light', 'dark')`,
    ),
    check(
      'settings_editor_font_size_check',
      sql`${table.editorFontSize} IN ('small', 'medium', 'large')`,
    ),
    check(
      'settings_default_export_format_check',
      sql`${table.defaultExportFormat} IN ('markdown', 'json')`,
    ),
  ],
);
