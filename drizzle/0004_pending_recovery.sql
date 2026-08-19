UPDATE "entries" SET "updated_at" = now() WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "entries_ai_status_updated_at_idx" ON "entries" USING btree ("ai_status","updated_at");
