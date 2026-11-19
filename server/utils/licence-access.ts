import type { AccountRole } from './customer-account'

export function canManageBilling(role: AccountRole) {
  return role === 'owner' || role === 'billing_manager'
}
