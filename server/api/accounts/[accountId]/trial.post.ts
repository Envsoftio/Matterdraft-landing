import { client } from '../../../../lib/db'
import { applicationFailure, applicationRoute } from '../../../utils/application-error'
import { requireAccount } from '../../../utils/customer-account'
import { readSameOriginJson } from '../../../utils/json-request'
import { licenceTrialsEnabled, startLicenceTrial } from '../../../utils/licence-trials'

export default applicationRoute('/api/accounts/[accountId]/trial', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { account, user } = await requireAccount(event, getRouterParam(event, 'accountId') || '')
  if (account.role !== 'owner') applicationFailure(403)
  if (!licenceTrialsEnabled()) applicationFailure(503)
  await readSameOriginJson(event)
  return { trial: await startLicenceTrial(client, account.id, user.id) }
})
