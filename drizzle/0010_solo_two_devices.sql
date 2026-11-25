ALTER TABLE `licence_purchase` ADD `total_amount` integer;--> statement-breakpoint
UPDATE `licence_plan`
SET `minimum_devices` = 2, `revision` = `revision` + 1
WHERE `id` = 'launch-solo' AND `account_type` = 'personal' AND `minimum_devices` <> 2;
