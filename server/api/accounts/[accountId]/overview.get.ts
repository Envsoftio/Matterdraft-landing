import { applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { getLicenceTrial, licenceTrialsEnabled } from '../../../utils/licence-trials'
import { listLicencePlans, publicPlan } from '../../../utils/licence-plans'
import { canManageBilling } from '../../../utils/licence-access'
import { client } from '../../../../lib/db'

export default applicationRoute('/api/accounts/[accountId]/overview', async (event) => {
  const accountId = getRouterParam(event, 'accountId') || ''
  const { account } = await requireAccount(event, accountId)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const canBill = canManageBilling(account.role)
  const [members, trial, plans] = await Promise.all([
    account.accountType === 'organisation'
      ? client.execute({
          sql: 'SELECT COUNT(*) AS count FROM account_membership WHERE account_id = ?',
          args: [accountId],
        })
      : null,
    canBill ? getLicenceTrial(client, accountId) : null,
    canBill ? listLicencePlans(client, account.accountType) : [],
  ])
  const trialsEnabled = licenceTrialsEnabled()
  return {
    account,
    memberCount: members ? Number(members.rows[0]?.count || 0) : null,
    canBill,
    trial: trial && (trialsEnabled || trial.status !== 'available') ? trial : null,
    canStartTrial: trialsEnabled && account.role === 'owner' && trial?.status === 'available',
    plans: plans
      .slice(0, 3)
      .map(publicPlan)
      .map(({ id, name, monthlyPrice }) => ({ id, name, monthlyPrice })),
  }
})
