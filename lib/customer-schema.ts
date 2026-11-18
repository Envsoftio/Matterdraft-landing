import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'

export const customerAccount = sqliteTable('customer_account', {
  id: text('id').primaryKey(),
  accountType: text('account_type', { enum: ['personal', 'organisation'] }).notNull(),
  name: text('name').notNull(),
  personalOwnerUserId: text('personal_owner_user_id').unique().references(() => user.id),
  createdAt: integer('created_at').notNull(),
})

export const accountMembership = sqliteTable('account_membership', {
  accountId: text('account_id').notNull().references(() => customerAccount.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'billing_manager', 'member'] }).notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [
  primaryKey({ columns: [table.accountId, table.userId] }),
  index('account_membership_user_idx').on(table.userId),
])

export const staffAccess = sqliteTable('staff_access', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['super_admin', 'support_operator', 'billing_operator'] }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
})

export const auditEvent = sqliteTable('audit_event', {
  id: text('id').primaryKey(),
  accountId: text('account_id'),
  actorUserId: text('actor_user_id').references(() => user.id),
  eventType: text('event_type').notNull(),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id').notNull(),
  eventDetail: text('event_detail').notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [
  index('audit_event_account_created_idx').on(table.accountId, table.createdAt),
])

export const organisationInvitation = sqliteTable('organisation_invitation', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => customerAccount.id, { onDelete: 'cascade' }),
  inviteeEmail: text('invitee_email').notNull(),
  invitedRole: text('invited_role', { enum: ['owner', 'admin', 'billing_manager', 'member'] }).notNull(),
  invitationType: text('invitation_type', { enum: ['member', 'transfer'] }).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  invitationStatus: text('invitation_status', { enum: ['pending', 'accepted', 'revoked'] }).notNull(),
  invitedByUserId: text('invited_by_user_id').notNull().references(() => user.id),
  transferRecipientUserId: text('transfer_recipient_user_id').references(() => user.id),
  acceptedByUserId: text('accepted_by_user_id').references(() => user.id),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  acceptedAt: integer('accepted_at'),
  revokedAt: integer('revoked_at'),
}, table => [
  index('organisation_invitation_account_idx').on(table.accountId, table.invitationStatus),
  index('organisation_invitation_invitee_idx').on(table.inviteeEmail, table.invitationStatus),
])

export const supportTicket = sqliteTable('support_ticket', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => customerAccount.id),
  createdByUserId: text('created_by_user_id').notNull().references(() => user.id),
  category: text('category', { enum: ['question', 'bug', 'billing', 'feedback'] }).notNull(),
  subject: text('subject').notNull(),
  status: text('status', { enum: ['open', 'awaiting_support', 'awaiting_customer', 'resolved', 'closed'] }).notNull(),
  creationKey: text('creation_key').notNull().unique(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, table => [
  index('support_ticket_creator_idx').on(table.accountId, table.createdByUserId, table.updatedAt),
  index('support_ticket_updated_idx').on(table.updatedAt),
])

export const supportMessage = sqliteTable('support_message', {
  id: text('id').primaryKey(),
  ticketId: text('ticket_id').notNull().references(() => supportTicket.id),
  authorUserId: text('author_user_id').notNull().references(() => user.id),
  authorType: text('author_type', { enum: ['customer', 'staff'] }).notNull(),
  body: text('body').notNull(),
  submissionKey: text('submission_key').notNull().unique(),
  createdAt: integer('created_at').notNull(),
}, table => [index('support_message_ticket_idx').on(table.ticketId, table.createdAt)])
