import { randomUUID } from 'node:crypto'
import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { client } from '../../../lib/db'
import { requireStaff } from '../../utils/customer-account'
import { listCustomers } from '../../utils/customer-directory'

export default applicationRoute('/api/internal/customers', async event => {
  const actor = await requireStaff(event, 'super_admin')
  const query = getQuery(event)
  if ((query.search !== undefined && typeof query.search !== 'string') ||
      (query.page !== undefined && typeof query.page !== 'string')) applicationFailure(422)
  const search = typeof query.search === 'string' ? query.search.trim() : ''
  const page = typeof query.page === 'string' ? Number(query.page) : 1
  if (search.length > 100 || !Number.isSafeInteger(page) || page < 1 || page > 1000) applicationFailure(422)

  const result = await listCustomers(client, search, page)
  await client.execute({
    sql: `INSERT INTO audit_event
      (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
      VALUES (?, ?, 'staff.customers_viewed', 'customer_directory', 'all', 'Viewed customer directory', ?)`,
    args: [randomUUID(), actor.id, Date.now()],
  })
  return result
})
