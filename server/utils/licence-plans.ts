import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'
import { applicationFailure } from './application-error.ts'
import { validText } from './support.ts'

export type LicencePlanStatus = 'draft' | 'published' | 'archived'
export type LicencePlanAccountType = 'personal' | 'organisation'

export function publicPlan(row: Row) {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    monthlyDevicePrice: Number(row.monthly_device_price),
  }
}

export async function listLicencePlans(db: Client, accountType?: string) {
  const result = await db.execute(
    accountType
      ? {
          sql: "SELECT * FROM licence_plan WHERE status = 'published' AND account_type = ? ORDER BY monthly_device_price, name, id",
          args: [accountType],
        }
      : "SELECT * FROM licence_plan ORDER BY CASE status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, created_at DESC, id",
  )
  return result.rows
}

export function staffPlan(row: Row) {
  return {
    ...publicPlan(row),
    accountType: row.account_type as LicencePlanAccountType,
    status: row.status as LicencePlanStatus,
    revision: Number(row.revision),
  }
}

function planInput(input: Record<string, unknown>) {
  const { name, description, accountType, monthlyDevicePrice } = input
  if (
    !validText(name, 80) ||
    !validText(description, 700) ||
    (accountType !== 'personal' && accountType !== 'organisation') ||
    typeof monthlyDevicePrice !== 'number' ||
    !Number.isSafeInteger(monthlyDevicePrice) ||
    monthlyDevicePrice < 1 ||
    monthlyDevicePrice > 99999999
  )
    applicationFailure(422)
  return [name.trim(), description.trim(), accountType, monthlyDevicePrice] as const
}

export async function saveLicencePlan(db: Client, actorId: string, input: Record<string, unknown>) {
  const action = input.action
  if (action !== 'create' && action !== 'edit' && action !== 'publish' && action !== 'archive')
    applicationFailure(422)
  const id = action === 'create' ? randomUUID() : input.id
  const revision = input.revision
  if (
    typeof id !== 'string' ||
    (action !== 'create' && (typeof revision !== 'number' || !Number.isSafeInteger(revision)))
  )
    applicationFailure(422)
  const details = action === 'create' || action === 'edit' ? planInput(input) : null

  const tx = await db.transaction('write')
  try {
    const now = Date.now()
    const mutation =
      action === 'create' && details
        ? await tx.execute({
            sql: "INSERT INTO licence_plan (id, name, description, account_type, monthly_device_price, status, created_at) VALUES (?, ?, ?, ?, ?, 'draft', ?) RETURNING *",
            args: [id, ...details, now],
          })
        : action === 'edit' && details
          ? await tx.execute({
              sql: "UPDATE licence_plan SET name = ?, description = ?, account_type = ?, monthly_device_price = ?, revision = revision + 1 WHERE id = ? AND revision = ? AND status = 'draft' RETURNING *",
              args: [...details, id, revision as number],
            })
          : await tx.execute({
              sql: 'UPDATE licence_plan SET status = ?, revision = revision + 1 WHERE id = ? AND revision = ? AND status = ? RETURNING *',
              args: [
                action === 'publish' ? 'published' : 'archived',
                id,
                revision as number,
                action === 'publish' ? 'draft' : 'published',
              ],
            })
    const plan = mutation.rows[0]
    if (!plan) applicationFailure(409)
    await tx.execute({
      sql: "INSERT INTO audit_event (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at) VALUES (?, ?, ?, 'licence_plan', ?, ?, ?)",
      args: [
        randomUUID(),
        actorId,
        `licence_plan.${action}`,
        id,
        JSON.stringify({
          status: plan.status,
          monthlyDevicePrice: plan.monthly_device_price,
          accountType: plan.account_type,
        }),
        now,
      ],
    })
    await tx.commit()
    return staffPlan(plan)
  } finally {
    tx.close()
  }
}
