export function stockLabel(qty: number): { label: string; tone: 'in' | 'low' | 'out' } {
  if (qty <= 0) return { label: 'Out of Stock', tone: 'out' }
  if (qty < 5) return { label: `Only ${qty} left`, tone: 'low' }
  return { label: 'In Stock on Maylor St', tone: 'in' }
}
