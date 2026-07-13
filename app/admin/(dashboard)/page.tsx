import Link from 'next/link'
import { AlertTriangle, ArrowRight, Package, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { formatCurrency } from '@/lib/format'

const LOW_STOCK_THRESHOLD = 5

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [todayOrders, lowStock, productCount] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total_eur, status', { count: 'exact' })
      .eq('shop_id', SHOP_ID)
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('products')
      .select('id, name, stock_qty')
      .eq('shop_id', SHOP_ID)
      .eq('active', true)
      .lt('stock_qty', LOW_STOCK_THRESHOLD)
      .order('stock_qty', { ascending: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID).eq('active', true),
  ])

  const todayTotal = (todayOrders.data ?? []).reduce((sum, o) => sum + Number(o.total_eur), 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Today at a glance</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-cyan-200">
            <ShoppingCart className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Today&apos;s orders</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{todayOrders.count ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-400">{formatCurrency(todayTotal)} total</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-fuchsia-200">
            <Package className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Active products</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{productCount.count ?? 0}</p>
          <Link href="/admin/stock" className="mt-1 inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
            Manage stock <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-amber-200">
            <AlertTriangle className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Low stock</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{lowStock.data?.length ?? 0}</p>
          <p className="mt-1 text-sm text-zinc-400">Below {LOW_STOCK_THRESHOLD} units</p>
        </div>
      </div>

      {lowStock.data && lowStock.data.length > 0 ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Low stock alerts</p>
          <div className="mt-3 space-y-2">
            {lowStock.data.map((p) => (
              <Link
                key={p.id}
                href={`/admin/stock?highlight=${p.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 transition hover:border-amber-400/30"
              >
                <span className="text-sm text-white">{p.name}</span>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                  {p.stock_qty} left
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
