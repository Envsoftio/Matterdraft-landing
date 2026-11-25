import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'
import { maximumAccessMonths } from '../../shared/utils/prepaid-pricing.ts'
import { applicationFailure } from './application-error.ts'

export function normalizeCouponCode(value: unknown) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{2,31}$/i.test(value.trim())
    ? value.trim().toUpperCase()
    : null
}

function offerView(row: Row) {
  return {
    id: String(row.id),
    code: String(row.code),
    status: row.status as 'draft' | 'published' | 'paused',
    revision: Number(row.revision),
    discountAmount: Number(row.discount_amount),
    planId: row.plan_id as string | null,
    audience: row.audience as 'personal' | 'organisation' | null,
    accessMonths: row.access_months as number | null,
    purchaseKind: row.purchase_kind as 'first' | 'renewal' | null,
    startsAt: row.starts_at as number | null,
    endsAt: row.ends_at as number | null,
    redemptionLimit: row.redemption_limit as number | null,
    reserved: Number(row.reserved ?? 0),
    redeemed: Number(row.redeemed ?? 0),
  }
}

export async function listCouponOffers(db: Client) {
  const { rows } = await db.execute(`SELECT o.*,
    (SELECT count(*) FROM licence_purchase WHERE coupon_offer_id = o.id AND status = 'pending') AS reserved,
    (SELECT count(*) FROM licence_purchase WHERE coupon_offer_id = o.id AND status = 'paid') AS redeemed
    FROM coupon_offer o ORDER BY code`)
  return rows.map(offerView)
}

export async function eligibleCouponOffer(
  db: Pick<Client, 'execute'>,
  code: string,
  accountId: string,
  accountType: string,
  planId: string,
  months: number,
  now: number,
) {
  const { rows } = await db.execute({
    sql: `SELECT * FROM coupon_offer o WHERE code = ? AND status = 'published'
      AND (audience IS NULL OR audience = ?) AND (plan_id IS NULL OR plan_id = ?)
      AND (access_months IS NULL OR access_months = ?)
      AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)
      AND (purchase_kind IS NULL OR purchase_kind = CASE WHEN EXISTS (
        SELECT 1 FROM licence_purchase WHERE account_id = ? AND status = 'paid'
      ) THEN 'renewal' ELSE 'first' END)
      AND (redemption_limit IS NULL OR redemption_limit > (
        SELECT count(*) FROM licence_purchase WHERE coupon_offer_id = o.id AND status IN ('pending', 'paid')
      ))`,
    args: [code, accountType, planId, months, now, now, accountId],
  })
  return rows[0] ? offerView(rows[0]) : null
}

function optionalInteger(value: unknown, max: number) {
  if (value == null) return null
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > max)
    applicationFailure(422)
  return value
}

export async function saveCouponOffer(db: Client, actorId: string, input: Record<string, unknown>) {
  const { action, revision } = input
  const id = action === 'create' ? randomUUID() : input.id
  if (
    (action !== 'create' && action !== 'edit' && action !== 'publish' && action !== 'pause') ||
    typeof id !== 'string' ||
    (action !== 'create' && (typeof revision !== 'number' || !Number.isSafeInteger(revision)))
  )
    applicationFailure(422)

  const tx = await db.transaction('write')
  try {
    let mutation
    if (action === 'create' || action === 'edit') {
      const code = normalizeCouponCode(input.code)
      const discountAmount = optionalInteger(input.discountAmount, 99999999)
      const audience = input.audience ?? null
      const planId = input.planId ?? null
      const purchaseKind = input.purchaseKind ?? null
      const months = optionalInteger(input.accessMonths, maximumAccessMonths)
      const startsAt = optionalInteger(input.startsAt, 253402300799999)
      const endsAt = optionalInteger(input.endsAt, 253402300799999)
      const limit = optionalInteger(input.redemptionLimit, 1000000)
      if (
        !code ||
        !discountAmount ||
        (audience !== null && audience !== 'personal' && audience !== 'organisation') ||
        (purchaseKind !== null && purchaseKind !== 'first' && purchaseKind !== 'renewal') ||
        (planId !== null && typeof planId !== 'string') ||
        (startsAt !== null && endsAt !== null && endsAt <= startsAt)
      )
        applicationFailure(422)
      if (planId !== null) {
        const { rows } = await tx.execute({
          sql: 'SELECT account_type FROM licence_plan WHERE id = ?',
          args: [planId],
        })
        if (!rows[0] || (audience && rows[0].account_type !== audience)) applicationFailure(422)
      }
      const fields = [
        code,
        discountAmount,
        planId,
        audience,
        months,
        purchaseKind,
        startsAt,
        endsAt,
        limit,
      ]
      mutation =
        action === 'create'
          ? await tx.execute({
              sql: `INSERT INTO coupon_offer
              (id, code, discount_amount, plan_id, audience, access_months, purchase_kind, starts_at, ends_at, redemption_limit, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft') ON CONFLICT(code) DO NOTHING RETURNING *`,
              args: [id, ...fields],
            })
          : await tx.execute({
              sql: `UPDATE coupon_offer SET code = ?, discount_amount = ?, plan_id = ?, audience = ?, access_months = ?,
              purchase_kind = ?, starts_at = ?, ends_at = ?, redemption_limit = ?, revision = revision + 1
              WHERE id = ? AND revision = ? AND NOT EXISTS (SELECT 1 FROM coupon_offer WHERE code = ? AND id <> ?)
              RETURNING *`,
              args: [...fields, id, revision as number, code, id],
            })
    } else {
      const status = action === 'publish' ? 'published' : 'paused'
      mutation = await tx.execute({
        sql: `UPDATE coupon_offer SET status = ?, revision = revision + 1
          WHERE id = ? AND revision = ? AND status <> ? RETURNING *`,
        args: [status, id, revision as number, status],
      })
    }
    if (!mutation.rows[0]) applicationFailure(409)
    const offer = offerView(mutation.rows[0])
    await tx.execute({
      sql: `INSERT INTO audit_event (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
        VALUES (?, ?, ?, 'coupon_offer', ?, ?, ?)`,
      args: [
        randomUUID(),
        actorId,
        `coupon_offer.${action}`,
        id,
        JSON.stringify(offer),
        Date.now(),
      ],
    })
    await tx.commit()
    return offer
  } finally {
    tx.close()
  }
}
