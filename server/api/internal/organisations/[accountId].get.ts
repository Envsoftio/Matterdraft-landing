import { randomUUID } from 'node:crypto'
import { applicationRoute, applicationFailure } from '../../../utils/application-error'
import { client } from '../../../../lib/db'
import { requireStaff } from '../../../utils/customer-account'
import { getOrganisationDetails } from '../../../utils/organisation-directory'

export default applicationRoute('/api/internal/organisations/[accountId]', async event => {
  const actor = await requireStaff(event, 'super_admin')
  const accountId = getRouterParam(event, 'accountId') || ''
  if (!/^[0-9a-f-]{36}$/.test(accountId)) applicationFailure(404)

  const details = await getOrganisationDetails(client, accountId)
  if (!details) applicationFailure(404)
  await client.execute({
    sql: `INSERT INTO audit_event (id, actor_user_id, event_type, subject_type, subject_id, event_detail, created_at)
      VALUES (?, ?, 'staff.organisation_viewed', 'account', ?, 'Viewed organisation', ?)`,
    args: [randomUUID(), actor.id, accountId, Date.now()],
  })
  return details
})
