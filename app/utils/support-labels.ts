export function supportStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: 'Open',
    awaiting_support: 'Awaiting support',
    awaiting_customer: 'Awaiting your reply',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  return labels[status] || status.replaceAll('_', ' ')
}

export function supportCategoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}
