CREATE TABLE `coupon_offer` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_amount` integer NOT NULL,
	`status` text NOT NULL,
	`plan_id` text,
	`audience` text,
	`access_months` integer,
	`purchase_kind` text,
	`starts_at` integer,
	`ends_at` integer,
	`redemption_limit` integer,
	`revision` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `licence_plan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_offer_code_unique` ON `coupon_offer` (`code`);--> statement-breakpoint
ALTER TABLE `licence_purchase` ADD `coupon_offer_id` text REFERENCES coupon_offer(id);--> statement-breakpoint
ALTER TABLE `licence_purchase` ADD `coupon_offer_revision` integer;--> statement-breakpoint
ALTER TABLE `licence_purchase` ADD `coupon_code` text;--> statement-breakpoint
ALTER TABLE `licence_purchase` ADD `coupon_discount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `licence_purchase_coupon_idx` ON `licence_purchase` (`coupon_offer_id`,`status`);