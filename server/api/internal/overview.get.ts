import { applicationRoute } from '../../utils/application-error'
import { client } from '../../../lib/db'
import { requireStaff } from '../../utils/customer-account'

export default applicationRoute('/api/internal/overview', async (event) => {
  await requireStaff(event, 'super_admin')
  const [users, accounts, organisations, staff] = await Promise.all([
    client.execute(`SELECT COUNT(*) AS count FROM user
      WHERE NOT EXISTS (SELECT 1 FROM staff_access WHERE user_id = user.id)`),
    client.execute(`SELECT COUNT(*) AS count FROM customer_account
      WHERE NOT EXISTS (SELECT 1 FROM staff_access WHERE user_id = personal_owner_user_id)`),
    client.execute(
      "SELECT COUNT(*) AS count FROM customer_account WHERE account_type = 'organisation'",
    ),
    client.execute('SELECT COUNT(*) AS count FROM staff_access WHERE active = 1'),
  ])
  return {
    counts: {
      users: Number(users.rows[0]?.count || 0),
      accounts: Number(accounts.rows[0]?.count || 0),
      organisations: Number(organisations.rows[0]?.count || 0),
      staff: Number(staff.rows[0]?.count || 0),
    },
  }
})
