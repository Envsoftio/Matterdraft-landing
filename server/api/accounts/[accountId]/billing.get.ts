import { client } from '../../../../lib/db'
import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { canManageBilling } from '../../../utils/licence-access'
import { listLicencePlans, publicPlan } from '../../../utils/licence-plans'
import { getLicenceTrial, licenceTrialsEnabled } from '../../../utils/licence-trials'

export default applicationRoute('/api/accounts/[accountId]/billing', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { account } = await requireAccount(event, getRouterParam(event, 'accountId') || '')
  if (!canManageBilling(account.role)) applicationFailure(403)
  const [plans, trial] = await Promise.all([
    listLicencePlans(client, account.accountType),
    getLicenceTrial(client, account.id),
  ])
  const trialsEnabled = licenceTrialsEnabled()
  return {
    plans: plans.map(publicPlan),
    trial: trialsEnabled || trial.status !== 'available' ? trial : null,
    canStartTrial: trialsEnabled && account.role === 'owner' && trial.status === 'available',
  }
})
