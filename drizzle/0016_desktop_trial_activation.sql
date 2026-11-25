CREATE TABLE `trial_challenge` (
	`account_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`public_key` text NOT NULL,
	`nonce` text NOT NULL,
	`issued_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `customer_account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trial_installation` (
	`account_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`public_key` text NOT NULL,
	`registered_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `licence_trial`(`account_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
