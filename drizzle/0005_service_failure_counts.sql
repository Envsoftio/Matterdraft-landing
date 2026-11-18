CREATE TABLE `service_failure_count` (
	`hour_started_at` integer NOT NULL,
	`status_code` integer NOT NULL,
	`request_count` integer NOT NULL,
	PRIMARY KEY(`hour_started_at`, `status_code`)
);
