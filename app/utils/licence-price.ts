const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
})

export function licencePrice(paise: number) {
  return inr.format(paise / 100)
}
