export const maximumAccessMonths = 12
export interface PrepaidDiscount {
  minimumMonths: number
  discountPercent: number
}

export function accessMonthsLabel(months: number) {
  return `${months} ${months === 1 ? 'month' : 'months'}`
}

export function accessDiscountPercent(months: number, discounts: readonly PrepaidDiscount[]) {
  return discounts.findLast((discount) => months >= discount.minimumMonths)?.discountPercent ?? 0
}

export function prepaidPrice(monthlyAmount: number, months: number, discountPercent: number) {
  const subtotal = monthlyAmount * months
  const total = Math.max(100, Math.floor((subtotal * (100 - discountPercent) + 50) / 100))
  return { subtotal, discountPercent, total, savings: subtotal - total }
}
