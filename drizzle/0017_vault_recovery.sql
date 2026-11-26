CREATE TABLE `vault_recovery_attempt` (
	`user_id` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`attempts` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vault_recovery_key` (
	`account_id` text NOT NULL,
	`user_id` text NOT NULL,
	`vault_id` text NOT NULL,
	`ciphertext` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`account_id`, `user_id`, `vault_id`),
	FOREIGN KEY (`account_id`) REFERENCES `customer_account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
