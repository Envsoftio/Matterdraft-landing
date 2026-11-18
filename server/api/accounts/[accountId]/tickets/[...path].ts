import { applicationFailure, applicationRoute } from '../../../../utils/application-error'
import { requireAccount } from '../../../../utils/customer-account'
import { client } from '../../../../../lib/db'
import {
  addReply,
  createTicket,
  getCustomerTicket,
  idPattern,
  listCustomerTickets,
  readSupportInput,
  ticketCategories,
  validKey,
  validText,
} from '../../../../utils/support'

export default applicationRoute('/api/accounts/[accountId]/tickets/[...path]', async (event) => {
  const accountId = getRouterParam(event, 'accountId') || ''
  const { user } = await requireAccount(event, accountId)
  const parts = (getRouterParam(event, 'path') || '').split('/').filter(Boolean)
  const method = event.method
  if (method === 'GET' && parts.length === 0) {
    const rawPage = getQuery(event).page
    if (rawPage !== undefined && typeof rawPage !== 'string') applicationFailure(422)
    const page = rawPage === undefined ? 1 : Number(rawPage)
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000) applicationFailure(422)
    return listCustomerTickets(client, accountId, user.id, page)
  }
  if (method === 'POST' && parts.length === 0) {
    const input = await readSupportInput(event)
    if (
      typeof input.category !== 'string' ||
      !ticketCategories.includes(input.category as (typeof ticketCategories)[number]) ||
      !validText(input.subject, 120) ||
      !validText(input.body, 10000) ||
      !validKey(input.submissionKey)
    )
      applicationFailure(422)
    return createTicket(
      client,
      accountId,
      user.id,
      input.category,
      input.subject.trim(),
      input.body.trim(),
      input.submissionKey,
    )
  }
  if (!idPattern.test(parts[0] || '')) applicationFailure(404)
  const ticketId = parts[0]!
  if (method === 'GET' && parts.length === 1) {
    const result = await getCustomerTicket(client, accountId, user.id, ticketId)
    if (!result) applicationFailure(404)
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
    return addReply(
      client,
      ticketId,
      user.id,
      'customer',
      input.body.trim(),
      input.submissionKey,
      accountId,
    )
  }
  applicationFailure(404)
})
