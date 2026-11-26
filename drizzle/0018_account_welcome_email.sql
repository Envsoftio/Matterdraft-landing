CREATE TABLE `account_welcome_email` (
	`user_id` text PRIMARY KEY NOT NULL,
	`attempted_at` integer NOT NULL,
	`sent_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
