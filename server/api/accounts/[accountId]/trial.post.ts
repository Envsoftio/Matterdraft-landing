import { applicationFailure, applicationRoute } from '../../../utils/application-error'

export default applicationRoute('/api/accounts/[accountId]/trial', (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  applicationFailure(404)
})
