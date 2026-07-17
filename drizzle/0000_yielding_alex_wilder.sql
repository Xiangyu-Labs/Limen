CREATE TABLE IF NOT EXISTS `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`title` text,
	`summary` text,
	`tags` text,
	`source` text DEFAULT 'web',
	`ai_status` text DEFAULT 'pending',
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
UPDATE `entries`
SET `created_at` = COALESCE(`updated_at`, CAST(strftime('%s', 'now', 'start of day') AS INTEGER))
WHERE `created_at` IS NULL;--> statement-breakpoint
UPDATE `entries`
SET `created_at` = CAST(strftime('%s', date(`created_at`, 'unixepoch')) AS INTEGER)
WHERE `created_at` != CAST(strftime('%s', date(`created_at`, 'unixepoch')) AS INTEGER);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `entries_created_at_id_idx` ON `entries` (`created_at` DESC,`id` DESC);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rate_limits` (
	`ip` text PRIMARY KEY NOT NULL,
	`request_count` integer NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`expires_at` integer NOT NULL
);
