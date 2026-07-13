import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Cloud } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { formatCurrency, formatDateTime } from '@/lib/format'

type OrderItem = { name: string; price_eur: number; quantity: number }

export default async function MyOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login?redirect=/account/orders')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', SHOP_ID)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(77,220,255,0.2),_transparent_40%),linear-gradient(135deg,_#04070d_0%,_#090d16_55%,_#03050a_100%)] px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
            <ArrowLeft className="size-4" />
            Back to shop
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-slate-950">
              <Cloud className="size-4" />
            </span>
            <span className="font-display text-sm font-bold text-white">Sky Smoke 1</span>
          </Link>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">My account</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Your orders</h1>
        </div>

        <div className="space-y-3">
          {(orders ?? []).map((order) => {
            const items = (order.items as unknown as OrderItem[]) ?? []
            return (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-zinc-400">{order.created_at ? formatDateTime(order.created_at) : ''}</p>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 space-y-1 text-sm text-zinc-300">
                  {items.map((item, i) => (
                    <p key={i}>
                      {item.quantity} × {item.name}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  {order.discount_applied_percent ? (
                    <span className="text-sm text-emerald-300">{order.discount_applied_percent}% discount applied</span>
                  ) : (
                    <span />
                  )}
                  <span className="text-base font-semibold text-white">{formatCurrency(order.total_eur)}</span>
                </div>
              </div>
            )
          })}
          {(orders ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              No orders yet. Your pre-orders will show up here.
            </p>
          ) : null}
        </div>
      </div>
    </main>
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
