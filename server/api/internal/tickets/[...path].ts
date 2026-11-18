import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { requireStaff } from '../../../utils/customer-account'
import { client } from '../../../../lib/db'
import {
  addReply,
  getStaffTicket,
  idPattern,
  listStaffTickets,
  readSupportInput,
  setTicketStatus,
  ticketStatuses,
  validKey,
  validText,
  writeStaffAudit,
} from '../../../utils/support'

export default applicationRoute('/api/internal/tickets/[...path]', async (event) => {
  const actor = await requireStaff(event, 'super_admin')
  const parts = (getRouterParam(event, 'path') || '').split('/').filter(Boolean)
  const method = event.method
  if (method === 'GET' && parts.length === 0) {
    const query = getQuery(event)
    if (
      (query.search !== undefined && typeof query.search !== 'string') ||
      (query.page !== undefined && typeof query.page !== 'string')
    )
      applicationFailure(422)
    const search = typeof query.search === 'string' ? query.search.trim() : ''
    const page = query.page === undefined ? 1 : Number(query.page)
    if (search.length > 100 || !Number.isSafeInteger(page) || page < 1 || page > 1000)
      applicationFailure(422)
    const result = await listStaffTickets(client, search, page)
    await writeStaffAudit(client, actor.id, null, 'staff.tickets_viewed', 'all')
    return result
  }
  if (!idPattern.test(parts[0] || '')) applicationFailure(404)
  const ticketId = parts[0]!
  if (method === 'GET' && parts.length === 1) {
    const result = await getStaffTicket(client, ticketId)
    if (!result) applicationFailure(404)
    await writeStaffAudit(
      client,
      actor.id,
      result.ticket.accountId,
      'staff.ticket_viewed',
      ticketId,
    )
    return result
  }
  if (method === 'POST' && parts.length === 2 && parts[1] === 'replies') {
    const input = await readSupportInput(event)
    if (
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input) ||
      !validText(input.body, 10000) ||
      !validKey(input.submissionKey)
    )
      applicationFailure(422)
    return addReply(client, ticketId, actor.id, 'staff', input.body.trim(), input.submissionKey)
  }
  if (method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
    const input = await readSupportInput(event)
    if (
      typeof input.status !== 'string' ||
      !ticketStatuses.includes(input.status as (typeof ticketStatuses)[number])
    )
      applicationFailure(422)
    return setTicketStatus(client, ticketId, actor.id, input.status)
  }
  applicationFailure(404)
})
