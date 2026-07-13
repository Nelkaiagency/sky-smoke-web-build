import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { OrderStatusSelect } from '@/components/admin/order-status-select'

type OrderItem = { product_id?: string; name: string; price_eur: number; quantity: number }

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()

  if (!order) notFound()

  const items = (order.items as unknown as OrderItem[]) ?? []

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="size-4" />
        Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Order</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{order.customer_name}</h1>
          <p className="mt-1 text-sm text-zinc-400">{order.customer_phone}</p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">Items</p>
        <div className="mt-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
              <span className="text-white">
                {item.quantity} × {item.name}
              </span>
              <span className="text-zinc-300">{formatCurrency(item.price_eur * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          {order.subtotal_before_discount ? (
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal_before_discount)}</span>
            </div>
          ) : null}
          {order.discount_applied_percent ? (
            <div className="flex justify-between text-emerald-300">
              <span>Discount ({order.discount_applied_percent}%)</span>
              <span>
                -{formatCurrency((order.subtotal_before_discount ?? order.total_eur) - order.total_eur)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-semibold text-white">
            <span>Total</span>
            <span>{formatCurrency(order.total_eur)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Placed</p>
          <p className="mt-1">{order.created_at ? formatDateTime(order.created_at) : '—'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Collected</p>
          <p className="mt-1">{order.collected_at ? formatDateTime(order.collected_at) : 'Not yet collected'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Source</p>
          <p className="mt-1 capitalize">{order.source}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Account</p>
          <p className="mt-1">{order.customer_id ? 'Registered customer' : 'Guest checkout'}</p>
        </div>
      </div>
    </div>
  )
}
