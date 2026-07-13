import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const [movementsRes, ordersRes, categoriesRes] = await Promise.all([
    supabase
      .from('stock_movements')
      .select('id, product_id, change_qty, reason, source, created_at, products(name, category_id)')
      .eq('shop_id', SHOP_ID)
      .order('created_at', { ascending: true })
      .limit(5000),
    supabase
      .from('orders')
      .select('id, total_eur, status, created_at')
      .eq('shop_id', SHOP_ID)
      .order('created_at', { ascending: true })
      .limit(5000),
    supabase.from('product_categories').select('id, name').eq('shop_id', SHOP_ID).order('sort_order', { ascending: true }),
  ])

  const movements = (movementsRes.data ?? []).map((m) => ({
    id: m.id,
    product_id: m.product_id,
    product_name: m.products?.name ?? 'Unknown product',
    category_id: m.products?.category_id ?? null,
    change_qty: m.change_qty,
    reason: m.reason,
    source: m.source,
    created_at: m.created_at ?? '',
  }))

  const orders = (ordersRes.data ?? []).map((o) => ({
    id: o.id,
    total_eur: Number(o.total_eur),
    status: o.status,
    created_at: o.created_at ?? '',
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Insights</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Analytics</h1>
      </div>
      <AnalyticsDashboard movements={movements} orders={orders} categories={categoriesRes.data ?? []} />
    </div>
  )
}
