import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { DiscountTiersTable } from '@/components/admin/discount-tiers-table'

export default async function AdminDiscountsPage() {
  const supabase = await createClient()
  const { data: tiers } = await supabase
    .from('discount_tiers')
    .select('*')
    .eq('shop_id', SHOP_ID)
    .order('min_order_total', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Discounts</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Volume discount tiers</h1>
        <p className="mt-2 text-sm text-zinc-400">
          e.g. spend €50, get 10% off. The highest qualifying tier applies automatically at checkout.
        </p>
      </div>
      <DiscountTiersTable tiers={tiers ?? []} />
    </div>
  )
}
