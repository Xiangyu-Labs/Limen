DROP INDEX "entries_timeline_idx";--> statement-breakpoint
DROP INDEX "entries_ai_status_updated_at_idx";--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "entries_deleted_at_idx" ON "entries" USING btree ("deleted_at") WHERE "entries"."deleted_at" is not null;--> statement-breakpoint
CREATE INDEX "entries_timeline_idx" ON "entries" USING btree ("created_at" DESC NULLS LAST,"recorded_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "entries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "entries_ai_status_updated_at_idx" ON "entries" USING btree ("ai_status","updated_at") WHERE "entries"."deleted_at" is null;