import { applicationRoute, applicationFailure } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { client } from '../../../../lib/db'

export default applicationRoute('/api/accounts/[accountId]/overview', async (event) => {
  const accountId = getRouterParam(event, 'accountId') || ''
  const { account } = await requireAccount(event, accountId)
  const members =
    account.accountType === 'organisation'
      ? await client.execute({
          sql: 'SELECT COUNT(*) AS count FROM account_membership WHERE account_id = ?',
          args: [accountId],
        })
      : null
  return { account, memberCount: members ? Number(members.rows[0]?.count || 0) : null }
})
