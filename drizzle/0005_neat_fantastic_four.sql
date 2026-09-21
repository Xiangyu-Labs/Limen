CREATE TABLE "entry_tags" (
	"entry_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entry_tags_entry_id_tag_id_pk" PRIMARY KEY("entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_name_length_check" CHECK (char_length("tags"."name") between 1 and 50)
);
--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "tags_locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entry_tags" ADD CONSTRAINT "entry_tags_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_tags" ADD CONSTRAINT "entry_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entry_tags_tag_id_entry_id_idx" ON "entry_tags" USING btree ("tag_id","entry_id");--> statement-breakpoint
-- Backfill entries.tags (a JSON array stored as text) into tags/entry_tags.
--
-- Tolerant by design, matching parseStoredTags(): rows whose tags column is
-- NULL, invalid JSON, or valid JSON that is not an array are skipped rather
-- than aborting the migration. pg_input_is_valid requires PostgreSQL 16+,
-- which both Neon and the PGlite used by the test suite satisfy.
--
-- Normalization mirrors normalizeTags(): trim, cap at 50 characters, drop
-- empties, dedupe, and keep at most the first 10 tags per entry.
--
-- Both statements are ON CONFLICT DO NOTHING, so re-running is a no-op.
INSERT INTO "tags" ("name")
SELECT DISTINCT btrim(left(v.value, 50))
FROM "entries" e
CROSS JOIN LATERAL jsonb_array_elements_text(e."tags"::jsonb) AS v(value)
WHERE e."tags" IS NOT NULL
  AND pg_input_is_valid(e."tags", 'jsonb')
  AND jsonb_typeof(e."tags"::jsonb) = 'array'
  AND btrim(left(v.value, 50)) <> ''
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "entry_tags" ("entry_id", "tag_id")
SELECT s.entry_id, t."id"
FROM (
	SELECT e."id" AS entry_id,
	       btrim(left(v.value, 50)) AS name,
	       v.ordinality AS position
	FROM "entries" e
	CROSS JOIN LATERAL jsonb_array_elements_text(e."tags"::jsonb)
		WITH ORDINALITY AS v(value, ordinality)
	WHERE e."tags" IS NOT NULL
	  AND pg_input_is_valid(e."tags", 'jsonb')
	  AND jsonb_typeof(e."tags"::jsonb) = 'array'
) s
JOIN "tags" t ON t."name" = s.name
WHERE s.name <> '' AND s.position <= 10
ON CONFLICT DO NOTHING;
