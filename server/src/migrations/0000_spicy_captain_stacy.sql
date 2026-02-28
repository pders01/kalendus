CREATE TABLE `calendars` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`first_day_of_week` integer DEFAULT 1 NOT NULL,
	`color` text DEFAULT '#000000' NOT NULL,
	`theme_tokens` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`calendar_id` text NOT NULL,
	`heading` text NOT NULL,
	`content` text,
	`color` text DEFAULT '#1976d2' NOT NULL,
	`start_year` integer NOT NULL,
	`start_month` integer NOT NULL,
	`start_day` integer NOT NULL,
	`end_year` integer NOT NULL,
	`end_month` integer NOT NULL,
	`end_day` integer NOT NULL,
	`start_hour` integer,
	`start_minute` integer,
	`end_hour` integer,
	`end_minute` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_events_calendar_date` ON `events` (`calendar_id`,`start_year`,`start_month`,`start_day`);