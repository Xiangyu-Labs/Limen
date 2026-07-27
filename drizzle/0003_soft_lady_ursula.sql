CREATE TABLE "settings" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"time_zone" text DEFAULT 'Asia/Shanghai' NOT NULL,
	"editor_font_size" text DEFAULT 'medium' NOT NULL,
	"default_export_format" text DEFAULT 'markdown' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_theme_check" CHECK ("settings"."theme" IN ('system', 'light', 'dark')),
	CONSTRAINT "settings_editor_font_size_check" CHECK ("settings"."editor_font_size" IN ('small', 'medium', 'large')),
	CONSTRAINT "settings_default_export_format_check" CHECK ("settings"."default_export_format" IN ('markdown', 'json'))
);
