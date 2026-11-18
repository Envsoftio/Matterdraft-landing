import { applicationRoute, applicationFailure } from '../../utils/application-error'
import { accountContext } from '../../utils/customer-account'

export default applicationRoute('/api/portal/context', (event) => accountContext(event))
