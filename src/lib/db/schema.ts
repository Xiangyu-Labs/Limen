import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { normalizeToUtcDay } from "@/lib/entry-date";

export const entries = sqliteTable("entries", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  content: text("content").notNull(),
  title: text("title"),
  summary: text("summary"),
  tags: text("tags"), // JSON string of tags
  source: text("source").default("web"),
  aiStatus: text("ai_status").default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => normalizeToUtcDay(new Date())),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
  ip: text("ip").primaryKey(),
  requestCount: integer("request_count").notNull(),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
});
