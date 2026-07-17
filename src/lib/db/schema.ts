import { date, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { normalizeToUtcDay } from "@/lib/entry-date";

export const entries = pgTable("entries", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  content: text("content").notNull(),
  title: text("title"),
  summary: text("summary"),
  tags: text("tags"), // JSON string of tags
  source: text("source").default("web"),
  aiStatus: text("ai_status").default("pending"),
  createdAt: date("created_at", { mode: "date" }).notNull().$defaultFn(() => normalizeToUtcDay(new Date())),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).$defaultFn(() => new Date()),
}, (table) => [
  index("entries_created_at_id_idx").on(table.createdAt, table.id),
]);
