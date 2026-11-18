CREATE TABLE `portal_invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`kind` text NOT NULL,
	`token_hash` text NOT NULL,
	`status` text NOT NULL,
	`inviter_user_id` text NOT NULL,
	`target_user_id` text,
	`accepted_by_user_id` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_at` integer,
	`revoked_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `portal_account`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accepted_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_invitation_token_hash_unique` ON `portal_invitation` (`token_hash`);--> statement-breakpoint
CREATE INDEX `portal_invitation_account_idx` ON `portal_invitation` (`account_id`,`status`);--> statement-breakpoint
CREATE INDEX `portal_invitation_email_idx` ON `portal_invitation` (`email`,`status`);