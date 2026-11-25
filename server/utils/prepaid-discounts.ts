import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'
import { maximumAccessMonths, type PrepaidDiscount } from '../../shared/utils/prepaid-pricing.ts'
import { applicationFailure } from './application-error.ts'

export function publicDiscount(row: Row): PrepaidDiscount {
  return {
    minimumMonths: Number(row.minimum_months),
    discountPercent: Number(row.discount_percent),
  }
}

export function staffDiscount(row: Row) {
  return { ...publicDiscount(row), id: String(row.id), revision: Number(row.revision) }
}

export async function listPrepaidDiscounts(db: Client) {
  const { rows } = await db.execute('SELECT * FROM prepaid_discount ORDER BY minimum_months')
  return rows
}

// Use the same lookup when quoting and reserving, so a concurrent edit cannot lock in a stale rate.
export const prepaidDiscountForTerm = `COALESCE((
  SELECT discount_percent FROM prepaid_discount WHERE minimum_months <= ?
  ORDER BY minimum_months DESC LIMIT 1
), 0)`

export async function savePrepaidDiscount(
  db: Client,
  actorId: string,
  input: Record<string, unknown>,
) {
  const { action, revision, minimumMonths, discountPercent } = input
  const id = action === 'create' ? randomUUID() : input.id
  if (
    (action !== 'create' && action !== 'edit' && action !== 'delete') ||
    typeof id !== 'string' ||
    (action !== 'create' && (typeof revision !== 'number' || !Number.isSafeInteger(revision)))
  )
    applicationFailure(422)

  let statement
  if (action === 'delete') {
    statement = {
      sql: 'DELETE FROM prepaid_discount WHERE id = ? AND revision = ? RETURNING *',
      args: [id, revision as number],
    }
  } else {
    if (
      typeof minimumMonths !== 'number' ||
      !Number.isInteger(minimumMonths) ||
      minimumMonths < 1 ||
      minimumMonths > maximumAccessMonths ||
      typeof discountPercent !== 'number' ||
      !Number.isInteger(discountPercent) ||
      discountPercent < 1 ||
      discountPercent > 99
    )
      applicationFailure(422)

    statement =
      action === 'create'
        ? {
            sql: `INSERT INTO prepaid_discount (id, minimum_months, discount_percent)
            VALUES (?, ?, ?) ON CONFLICT(minimum_months) DO NOTHING RETURNING *`,
            args: [id, minimumMonths, discountPercent],
          }
        : {
            sql: `UPDATE prepaid_discount SET minimum_months = ?, discount_percent = ?, revision = revision + 1
            WHERE id = ? AND revision = ? AND NOT EXISTS (
              SELECT 1 FROM prepaid_discount WHERE minimum_months = ? AND id <> ?
            ) RETURNING *`,
            args: [minimumMonths, discountPercent, id, revision as number, minimumMonths, id],
          }
  }

  const tx = await db.transaction('write')
  try {
    const { rows } = await tx.execute(statement)
    if (!rows[0]) applicationFailure(409)
    const discount = staffDiscount(rows[0])
    await tx.execute({
      sql: `INSERT INTO audit_event (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
        VALUES (?, ?, ?, 'prepaid_discount', ?, ?, ?)`,
      args: [
        randomUUID(),
        actorId,
        `prepaid_discount.${action}`,
        id,
        JSON.stringify(discount),
        Date.now(),
      ],
    })
    await tx.commit()
    return discount
  } finally {
    tx.close()
  }
}
