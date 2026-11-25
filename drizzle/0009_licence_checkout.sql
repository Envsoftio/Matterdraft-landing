CREATE TABLE `licence_purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`buyer_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`plan_revision` integer NOT NULL,
	`plan_name` text NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`status` text NOT NULL,
	`link_id` text,
	`payment_id` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`paid_from` integer,
	`paid_through` integer,
	FOREIGN KEY (`account_id`) REFERENCES `customer_account`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`buyer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `licence_plan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `licence_purchase_link_id_unique` ON `licence_purchase` (`link_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `licence_purchase_payment_id_unique` ON `licence_purchase` (`payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `licence_purchase_pending_idx` ON `licence_purchase` (`account_id`) WHERE "licence_purchase"."status" = 'pending';--> statement-breakpoint
CREATE INDEX `licence_purchase_account_idx` ON `licence_purchase` (`account_id`,`paid_through`);--> statement-breakpoint
ALTER TABLE `licence_plan` ADD `minimum_devices` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
INSERT INTO licence_plan (id, name, description, account_type, monthly_device_price, minimum_devices, status, created_at)
VALUES
  ('launch-solo', 'Solo', 'For independent advocates. Use local OCR, PDF editing, indexes, bookmarks, preflight checks and multi-volume exports.', 'personal', 39900, 1, 'published', unixepoch() * 1000),
  ('launch-chamber', 'Chamber', 'For chambers preparing filings across several computers. Includes all desktop tools, with device licences billed to one chamber account.', 'organisation', 34900, 3, 'published', unixepoch() * 1000)
ON CONFLICT(id) DO NOTHING;
