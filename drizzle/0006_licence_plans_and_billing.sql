CREATE TABLE `licence_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`account_type` text NOT NULL,
	`monthly_device_price` integer NOT NULL,
	`payment_price_id` text,
	`status` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `licence_plan_payment_price_id_unique` ON `licence_plan` (`payment_price_id`);--> statement-breakpoint
CREATE TABLE `licence_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`initial_plan_id` text NOT NULL,
	`initial_quantity` integer NOT NULL,
	`paid_plan_id` text,
	`paid_quantity` integer,
	`paid_through` integer,
	`status` text NOT NULL,
	`payment_checkout_id` text,
	`payment_subscription_id` text,
	`payment_customer_id` text,
	`latest_invoice_id` text,
	`ends_at_period_end` integer DEFAULT false NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `customer_account`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`initial_plan_id`) REFERENCES `licence_plan`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paid_plan_id`) REFERENCES `licence_plan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `licence_subscription_payment_checkout_id_unique` ON `licence_subscription` (`payment_checkout_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `licence_subscription_payment_subscription_id_unique` ON `licence_subscription` (`payment_subscription_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `licence_subscription_open_account_idx` ON `licence_subscription` (`account_id`) WHERE "licence_subscription"."status" <> 'ended';--> statement-breakpoint
CREATE TABLE `licence_trial` (
	`account_id` text PRIMARY KEY NOT NULL,
	`started_by_user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `customer_account`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`started_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_event` (
	`id` text PRIMARY KEY NOT NULL,
	`processed_at` integer NOT NULL
);
