CREATE TABLE `desktop_download` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`version` text NOT NULL,
	`requested_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `desktop_download_requested_idx` ON `desktop_download` (`requested_at`,`id`);