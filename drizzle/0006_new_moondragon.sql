CREATE TABLE `service_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text NOT NULL,
	`intro_zh` text DEFAULT '' NOT NULL,
	`intro_en` text DEFAULT '' NOT NULL,
	`description_zh` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`items_zh` text DEFAULT '[]' NOT NULL,
	`items_en` text DEFAULT '[]' NOT NULL,
	`icon` text DEFAULT '✦' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_categories_slug_unique` ON `service_categories` (`slug`);