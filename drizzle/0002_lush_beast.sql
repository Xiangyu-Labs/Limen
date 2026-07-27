DROP INDEX "entries_created_at_id_idx";--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "recorded_at" timestamp with time zone;--> statement-breakpoint
UPDATE "entries"
SET "recorded_at" = COALESCE(
	"updated_at",
	"created_at"::timestamp AT TIME ZONE 'UTC'
);--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "recorded_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "recorded_at" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "entries_timeline_idx" ON "entries" USING btree ("created_at" DESC NULLS LAST,"recorded_at" DESC NULLS LAST,"id" DESC NULLS LAST);
