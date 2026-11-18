ALTER TABLE portal_account RENAME TO customer_account;--> statement-breakpoint
ALTER TABLE customer_account RENAME COLUMN kind TO account_type;--> statement-breakpoint
ALTER TABLE customer_account RENAME COLUMN personal_owner_id TO personal_owner_user_id;--> statement-breakpoint
DROP INDEX portal_account_personal_owner_id_unique;--> statement-breakpoint
CREATE UNIQUE INDEX customer_account_personal_owner_user_id_unique ON customer_account (personal_owner_user_id);--> statement-breakpoint
ALTER TABLE portal_membership RENAME TO account_membership;--> statement-breakpoint
DROP INDEX portal_membership_user_idx;--> statement-breakpoint
CREATE INDEX account_membership_user_idx ON account_membership (user_id);--> statement-breakpoint
ALTER TABLE portal_invitation RENAME TO organisation_invitation;--> statement-breakpoint
ALTER TABLE organisation_invitation RENAME COLUMN email TO invitee_email;--> statement-breakpoint
ALTER TABLE organisation_invitation RENAME COLUMN role TO invited_role;--> statement-breakpoint
ALTER TABLE organisation_invitation RENAME COLUMN kind TO invitation_type;--> statement-breakpoint
ALTER TABLE organisation_invitation RENAME COLUMN status TO invitation_status;--> statement-breakpoint
ALTER TABLE organisation_invitation RENAME COLUMN inviter_user_id TO invited_by_user_id;--> statement-breakpoint
ALTER TABLE organisation_invitation RENAME COLUMN target_user_id TO transfer_recipient_user_id;--> statement-breakpoint
DROP INDEX portal_invitation_token_hash_unique;--> statement-breakpoint
DROP INDEX portal_invitation_account_idx;--> statement-breakpoint
DROP INDEX portal_invitation_email_idx;--> statement-breakpoint
CREATE UNIQUE INDEX organisation_invitation_token_hash_unique ON organisation_invitation (token_hash);--> statement-breakpoint
CREATE INDEX organisation_invitation_account_idx ON organisation_invitation (account_id, invitation_status);--> statement-breakpoint
CREATE INDEX organisation_invitation_invitee_idx ON organisation_invitation (invitee_email, invitation_status);--> statement-breakpoint
ALTER TABLE portal_audit RENAME TO audit_event;--> statement-breakpoint
ALTER TABLE audit_event RENAME COLUMN action TO event_type;--> statement-breakpoint
ALTER TABLE audit_event RENAME COLUMN target_type TO subject_type;--> statement-breakpoint
ALTER TABLE audit_event RENAME COLUMN target_id TO subject_id;--> statement-breakpoint
ALTER TABLE audit_event RENAME COLUMN reason TO event_detail;--> statement-breakpoint
ALTER TABLE audit_event ADD COLUMN account_id text;--> statement-breakpoint
UPDATE audit_event SET account_id = CASE WHEN json_valid(event_detail) THEN CASE WHEN json_type(event_detail, '$.accountId') = 'text' THEN json_extract(event_detail, '$.accountId') END END;--> statement-breakpoint
CREATE INDEX audit_event_account_created_idx ON audit_event (account_id, created_at);
