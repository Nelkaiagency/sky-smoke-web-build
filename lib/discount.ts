export type DiscountTier = {
  min_order_total: number
  discount_percent: number
  active: boolean
}

/** Highest-percent tier the subtotal qualifies for, or 0 if none. */
export function bestDiscountPercent(tiers: DiscountTier[], subtotal: number): number {
  const qualifying = tiers.filter((t) => t.active && subtotal >= t.min_order_total)
  if (qualifying.length === 0) return 0
  return Math.max(...qualifying.map((t) => t.discount_percent))
}
