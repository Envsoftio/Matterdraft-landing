CREATE TABLE `support_ticket` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`category` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`creation_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `customer_account`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `support_ticket_creation_key_unique` ON `support_ticket` (`creation_key`);--> statement-breakpoint
CREATE INDEX `support_ticket_creator_idx` ON `support_ticket` (`account_id`,`created_by_user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `support_ticket_updated_idx` ON `support_ticket` (`updated_at`);--> statement-breakpoint
CREATE TABLE `support_message` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`author_type` text NOT NULL,
	`body` text NOT NULL,
	`submission_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `support_ticket`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `support_message_submission_key_unique` ON `support_message` (`submission_key`);--> statement-breakpoint
CREATE INDEX `support_message_ticket_idx` ON `support_message` (`ticket_id`,`created_at`);
