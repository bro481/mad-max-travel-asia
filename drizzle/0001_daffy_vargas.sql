CREATE TABLE `inquiry_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`destinations` text NOT NULL,
	`services` text NOT NULL,
	`travel_time` text,
	`message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
