-- Preserve any sandbox billing records while removing them from the active application schema.
ALTER TABLE `licence_subscription` RENAME TO `legacy_licence_subscription`;--> statement-breakpoint
ALTER TABLE `payment_event` RENAME TO `legacy_payment_event`;
