CREATE TABLE `prepaid_discount` (
	`id` text PRIMARY KEY NOT NULL,
	`minimum_months` integer NOT NULL,
	`discount_percent` integer NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "prepaid_discount_months_range" CHECK("prepaid_discount"."minimum_months" BETWEEN 1 AND 12),
	CONSTRAINT "prepaid_discount_percent_range" CHECK("prepaid_discount"."discount_percent" BETWEEN 1 AND 99)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prepaid_discount_minimum_months_unique` ON `prepaid_discount` (`minimum_months`);
--> statement-breakpoint
INSERT INTO prepaid_discount (id, minimum_months, discount_percent)
VALUES ('launch-discount-4', 4, 5), ('launch-discount-6', 6, 10), ('launch-discount-12', 12, 15);
