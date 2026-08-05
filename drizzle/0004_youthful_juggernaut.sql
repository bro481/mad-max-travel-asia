CREATE TABLE `image_import_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`property_id` integer,
	`images` text DEFAULT '[]' NOT NULL,
	`expires_at` text NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_import_sessions_code_unique` ON `image_import_sessions` (`code`);