import Link from 'next/link'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { formatCurrency, formatDateTime } from '@/lib/format'

const STATUSES = ['all', 'pending', 'confirmed', 'collected', 'cancelled'] as const

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeStatus = status && STATUSES.includes(status as (typeof STATUSES)[number]) ? status : 'all'

  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select('id, customer_name, customer_phone, total_eur, status, created_at, source')
    .eq('shop_id', SHOP_ID)
    .order('created_at', { ascending: false })

  if (activeStatus !== 'all') {
    query = query.eq('status', activeStatus)
  }

  const { data: orders } = await query

  const exportHref = activeStatus === 'all' ? '/admin/api/orders/export' : `/admin/api/orders/export?status=${activeStatus}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Orders</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">All orders</h1>
        </div>
        <a
          href={exportHref}
          className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
        >
          <Download className="size-4" />
          Export .xlsx
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/orders' : `/admin/orders?status=${s}`}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition ${
              activeStatus === s
                ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:border-cyan-400/20 hover:text-zinc-200'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {(orders ?? []).map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{order.customer_name}</p>
                <p className="text-sm text-zinc-400">{order.customer_phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">{formatCurrency(order.total_eur)}</span>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {formatDateTime(order.created_at!)} · {order.source}
            </p>
          </Link>
        ))}
        {(orders ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            No orders {activeStatus !== 'all' ? `with status "${activeStatus}"` : 'yet'}.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    confirmed: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    collected: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    cancelled: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  }
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${styles[status ?? 'pending'] ?? styles.pending}`}>
      {status ?? 'pending'}
    </span>
  )
}
