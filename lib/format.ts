export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
