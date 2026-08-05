CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text NOT NULL,
	`city` text NOT NULL,
	`area_zh` text DEFAULT '' NOT NULL,
	`area_en` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`guests` integer DEFAULT 2 NOT NULL,
	`bedrooms` integer DEFAULT 1 NOT NULL,
	`beds` integer DEFAULT 1 NOT NULL,
	`bathrooms` integer DEFAULT 1 NOT NULL,
	`description_zh` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`amenities` text DEFAULT '[]' NOT NULL,
	`highlights` text DEFAULT '[]' NOT NULL,
	`nearby` text DEFAULT '[]' NOT NULL,
	`price_from` integer DEFAULT 0 NOT NULL,
	`price_note` text DEFAULT '旺季价格请咨询' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `properties_slug_unique` ON `properties` (`slug`);