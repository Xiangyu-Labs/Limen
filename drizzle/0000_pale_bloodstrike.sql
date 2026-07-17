CREATE TABLE "entries" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"title" text,
	"summary" text,
	"tags" text,
	"source" text DEFAULT 'web',
	"ai_status" text DEFAULT 'pending',
	"created_at" date NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "entries_created_at_id_idx" ON "entries" USING btree ("created_at","id");