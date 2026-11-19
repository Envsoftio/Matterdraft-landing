import { client } from '../../../lib/db'
import { applicationRoute } from '../../utils/application-error'
import { requireStaff } from '../../utils/customer-account'
import { listLicencePlans, staffPlan } from '../../utils/licence-plans'

export default applicationRoute('/api/internal/plans', async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  await requireStaff(event, 'super_admin')
  return {
    plans: (await listLicencePlans(client)).map(staffPlan),
  }
})
