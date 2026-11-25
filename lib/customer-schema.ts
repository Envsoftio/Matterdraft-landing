import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'

export const customerAccount = sqliteTable('customer_account', {
  id: text('id').primaryKey(),
  accountType: text('account_type', { enum: ['personal', 'organisation'] }).notNull(),
  name: text('name').notNull(),
  personalOwnerUserId: text('personal_owner_user_id')
    .unique()
    .references(() => user.id),
  createdAt: integer('created_at').notNull(),
})

export const accountMembership = sqliteTable(
  'account_membership',
  {
    accountId: text('account_id')
      .notNull()
      .references(() => customerAccount.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'admin', 'billing_manager', 'member'] }).notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountId, table.userId] }),
    index('account_membership_user_idx').on(table.userId),
  ],
)

export const staffAccess = sqliteTable('staff_access', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['super_admin', 'support_operator', 'billing_operator'] }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
})

export const auditEvent = sqliteTable(
  'audit_event',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id'),
    actorUserId: text('actor_user_id').references(() => user.id),
    eventType: text('event_type').notNull(),
    subjectType: text('subject_type').notNull(),
    subjectId: text('subject_id').notNull(),
    eventDetail: text('event_detail').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('audit_event_account_created_idx').on(table.accountId, table.createdAt)],
)

export const organisationInvitation = sqliteTable(
  'organisation_invitation',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => customerAccount.id, { onDelete: 'cascade' }),
    inviteeEmail: text('invitee_email').notNull(),
    invitedRole: text('invited_role', {
      enum: ['owner', 'admin', 'billing_manager', 'member'],
    }).notNull(),
    invitationType: text('invitation_type', { enum: ['member', 'transfer'] }).notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    invitationStatus: text('invitation_status', {
      enum: ['pending', 'accepted', 'revoked'],
    }).notNull(),
    invitedByUserId: text('invited_by_user_id')
      .notNull()
      .references(() => user.id),
    transferRecipientUserId: text('transfer_recipient_user_id').references(() => user.id),
    acceptedByUserId: text('accepted_by_user_id').references(() => user.id),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    acceptedAt: integer('accepted_at'),
    revokedAt: integer('revoked_at'),
  },
  (table) => [
    index('organisation_invitation_account_idx').on(table.accountId, table.invitationStatus),
    index('organisation_invitation_invitee_idx').on(table.inviteeEmail, table.invitationStatus),
  ],
)

export const supportTicket = sqliteTable(
  'support_ticket',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => customerAccount.id),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id),
    category: text('category', { enum: ['question', 'bug', 'billing', 'feedback'] }).notNull(),
    subject: text('subject').notNull(),
    status: text('status', {
      enum: ['open', 'awaiting_support', 'awaiting_customer', 'resolved', 'closed'],
    }).notNull(),
    creationKey: text('creation_key').notNull().unique(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('support_ticket_creator_idx').on(table.accountId, table.createdByUserId, table.updatedAt),
    index('support_ticket_updated_idx').on(table.updatedAt),
  ],
)

export const supportMessage = sqliteTable(
  'support_message',
  {
    id: text('id').primaryKey(),
    ticketId: text('ticket_id')
      .notNull()
      .references(() => supportTicket.id),
    authorUserId: text('author_user_id')
      .notNull()
      .references(() => user.id),
    authorType: text('author_type', { enum: ['customer', 'staff'] }).notNull(),
    body: text('body').notNull(),
    submissionKey: text('submission_key').notNull().unique(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('support_message_ticket_idx').on(table.ticketId, table.createdAt)],
)

export const serviceFailureCount = sqliteTable(
  'service_failure_count',
  {
    hourStartedAt: integer('hour_started_at').notNull(),
    statusCode: integer('status_code').notNull(),
    requestCount: integer('request_count').notNull(),
  },
  (table) => [primaryKey({ columns: [table.hourStartedAt, table.statusCode] })],
)

export const licencePlan = sqliteTable('licence_plan', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  accountType: text('account_type', { enum: ['personal', 'organisation'] }).notNull(),
  monthlyPrice: integer('monthly_device_price').notNull(),
  minimumDevices: integer('minimum_devices').notNull().default(1),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull(),
  revision: integer('revision').notNull().default(1),
  createdAt: integer('created_at').notNull(),
})

export const prepaidDiscount = sqliteTable(
  'prepaid_discount',
  {
    id: text('id').primaryKey(),
    minimumMonths: integer('minimum_months').notNull().unique(),
    discountPercent: integer('discount_percent').notNull(),
    revision: integer('revision').notNull().default(1),
  },
  (table) => [
    check('prepaid_discount_months_range', sql`${table.minimumMonths} BETWEEN 1 AND 12`),
    check('prepaid_discount_percent_range', sql`${table.discountPercent} BETWEEN 1 AND 99`),
  ],
)

export const couponOffer = sqliteTable('coupon_offer', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountAmount: integer('discount_amount').notNull(),
  status: text('status', { enum: ['draft', 'published', 'paused'] }).notNull(),
  planId: text('plan_id').references(() => licencePlan.id),
  audience: text('audience', { enum: ['personal', 'organisation'] }),
  accessMonths: integer('access_months'),
  purchaseKind: text('purchase_kind', { enum: ['first', 'renewal'] }),
  startsAt: integer('starts_at'),
  endsAt: integer('ends_at'),
  redemptionLimit: integer('redemption_limit'),
  revision: integer('revision').notNull().default(1),
})

export const licencePurchase = sqliteTable(
  'licence_purchase',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => customerAccount.id),
    buyerId: text('buyer_id')
      .notNull()
      .references(() => user.id),
    planId: text('plan_id')
      .notNull()
      .references(() => licencePlan.id),
    planRevision: integer('plan_revision').notNull(),
    planName: text('plan_name').notNull(),
    unitPrice: integer('unit_price').notNull(),
    totalAmount: integer('total_amount'),
    quantity: integer('quantity').notNull(),
    accessMonths: integer('access_months').notNull().default(1),
    discountPercent: integer('discount_percent').notNull().default(0),
    couponOfferId: text('coupon_offer_id').references(() => couponOffer.id),
    couponOfferRevision: integer('coupon_offer_revision'),
    couponCode: text('coupon_code'),
    couponDiscount: integer('coupon_discount').notNull().default(0),
    status: text('status', { enum: ['pending', 'paid', 'expired'] }).notNull(),
    linkId: text('link_id').unique(),
    paymentId: text('payment_id').unique(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    paidFrom: integer('paid_from'),
    paidThrough: integer('paid_through'),
  },
  (table) => [
    uniqueIndex('licence_purchase_pending_idx')
      .on(table.accountId)
      .where(sql`${table.status} = 'pending'`),
    index('licence_purchase_account_idx').on(table.accountId, table.paidThrough),
    index('licence_purchase_coupon_idx').on(table.couponOfferId, table.status),
  ],
)

export const licenceTrial = sqliteTable('licence_trial', {
  accountId: text('account_id')
    .primaryKey()
    .references(() => customerAccount.id),
  startedByUserId: text('started_by_user_id')
    .notNull()
    .references(() => user.id),
  startedAt: integer('started_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
})

export const desktopDownload = sqliteTable(
  'desktop_download',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    version: text('version').notNull(),
    requestedAt: integer('requested_at').notNull(),
  },
  (table) => [index('desktop_download_requested_idx').on(table.requestedAt, table.id)],
)
