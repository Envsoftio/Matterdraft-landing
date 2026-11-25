import { randomUUID } from 'node:crypto'
import type { Client, Row } from '@libsql/client'
import { applicationFailure } from './application-error.ts'
import { validText } from './support.ts'

export type LicencePlanStatus = 'draft' | 'published' | 'archived'
export type LicencePlanAccountType = 'personal' | 'organisation'
const unusedPlan = `NOT EXISTS (SELECT 1 FROM licence_purchase WHERE plan_id = licence_plan.id)
  AND NOT EXISTS (SELECT 1 FROM coupon_offer WHERE plan_id = licence_plan.id)
  AND NOT EXISTS (SELECT 1 FROM legacy_licence_subscription
    WHERE initial_plan_id = licence_plan.id OR paid_plan_id = licence_plan.id)`

export function publicPlan(row: Row) {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    accountType: row.account_type as LicencePlanAccountType,
    monthlyPrice: Number(row.monthly_device_price),
    minimumDevices: Number(row.minimum_devices),
    revision: Number(row.revision),
  }
}

export async function listLicencePlans(db: Client, accountType?: string) {
  const result = await db.execute(
    accountType
      ? {
          sql: "SELECT * FROM licence_plan WHERE status = 'published' AND account_type = ? ORDER BY monthly_device_price, name, id",
          args: [accountType],
        }
      : `SELECT *, (${unusedPlan}) AS can_delete FROM licence_plan
        ORDER BY CASE status WHEN 'published' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, created_at DESC, id`,
  )
  return result.rows
}

export function staffPlan(row: Row) {
  return {
    ...publicPlan(row),
    status: row.status as LicencePlanStatus,
    canDelete: row.can_delete === 1,
  }
}

function planInput(input: Record<string, unknown>) {
  const { name, description, accountType, minimumDevices = 1 } = input
  const monthlyPrice = input.monthlyPrice ?? input.monthlyDevicePrice
  if (
    !validText(name, 80) ||
    !validText(description, 700) ||
    (accountType !== 'personal' && accountType !== 'organisation') ||
    typeof monthlyPrice !== 'number' ||
    !Number.isSafeInteger(monthlyPrice) ||
    monthlyPrice < 100 ||
    monthlyPrice > 99999999 ||
    typeof minimumDevices !== 'number' ||
    !Number.isInteger(minimumDevices) ||
    minimumDevices < 1 ||
    minimumDevices > 100
  )
    applicationFailure(422)
  return [name.trim(), description.trim(), accountType, monthlyPrice, minimumDevices] as const
}

export async function saveLicencePlan(db: Client, actorId: string, input: Record<string, unknown>) {
  const action = input.action
  if (
    action !== 'create' &&
    action !== 'edit' &&
    action !== 'publish' &&
    action !== 'archive' &&
    action !== 'delete'
  )
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
            sql: "INSERT INTO licence_plan (id, name, description, account_type, monthly_device_price, minimum_devices, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?) RETURNING *",
            args: [id, ...details, now],
          })
        : action === 'edit' && details
          ? await tx.execute({
              sql: "UPDATE licence_plan SET name = ?, description = ?, account_type = ?, monthly_device_price = ?, minimum_devices = ?, revision = revision + 1 WHERE id = ? AND revision = ? AND status IN ('draft', 'published') RETURNING *",
              args: [...details, id, revision as number],
            })
          : action === 'delete'
            ? await tx.execute({
                sql: `DELETE FROM licence_plan WHERE id = ? AND revision = ? AND ${unusedPlan} RETURNING *`,
                args: [id, revision as number],
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
          monthlyPrice: plan.monthly_device_price,
          minimumDevices: plan.minimum_devices,
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
