'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowDownRight, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

type Movement = {
  id: string
  product_id: string
  product_name: string
  category_id: string | null
  change_qty: number
  reason: string | null
  source: string | null
  created_at: string
}

type OrderRow = {
  id: string
  total_eur: number
  status: string | null
  created_at: string
}

type Category = { id: string; name: string }

type Window = '7' | '30'

const LOW_STOCK_THRESHOLD = 5

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayLabel(d: Date) {
  return new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short' }).format(d)
}

function lastNDays(n: number): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d)
  }
  return days
}

export function AnalyticsDashboard({
  movements,
  orders,
  categories,
}: {
  movements: Movement[]
  orders: OrderRow[]
  categories: Category[]
}) {
  const products = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of movements) map.set(m.product_id, m.product_name)
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [movements])

  return (
    <div className="space-y-6">
      <StockTrendCard movements={movements} products={products} categories={categories} />
      <OrdersOverTimeCard orders={orders} />
      <TopSellingCard movements={movements} />
      <LowStockFrequencyCard movements={movements} />
    </div>
  )
}

function WindowToggle({ value, onChange }: { value: Window; onChange: (w: Window) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
      {(['7', '30'] as Window[]).map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onChange(w)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            value === w ? 'bg-cyan-400/15 text-cyan-100' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {w}d
        </button>
      ))}
    </div>
  )
}

function StockTrendCard({
  movements,
  products,
  categories,
}: {
  movements: Movement[]
  products: { id: string; name: string }[]
  categories: Category[]
}) {
  const [windowDays, setWindowDays] = useState<Window>('30')
  const [productId, setProductId] = useState('all')
  const [categoryId, setCategoryId] = useState('all')

  const days = useMemo(() => lastNDays(Number(windowDays)), [windowDays])

  const data = useMemo(() => {
    const cutoff = days[0]
    const totals = new Map<string, number>()
    for (const m of movements) {
      const created = new Date(m.created_at)
      if (created < cutoff) continue
      if (productId !== 'all' && m.product_id !== productId) continue
      if (categoryId !== 'all' && m.category_id !== categoryId) continue
      const key = dayKey(created)
      totals.set(key, (totals.get(key) ?? 0) + m.change_qty)
    }
    return days.map((d) => ({ date: dayKey(d), label: dayLabel(d), value: totals.get(dayKey(d)) ?? 0 }))
  }, [movements, days, productId, categoryId])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-cyan-200">
          <TrendingUp className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Stock movement trend</p>
        </div>
        <WindowToggle value={windowDays} onChange={setWindowDays} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setProductId('all')
          }}
          className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-cyan-400/40 focus:outline-none"
        >
          <option value="all">All products</option>
          {products
            .filter((p) => categoryId === 'all' || movements.some((m) => m.product_id === p.id && m.category_id === categoryId))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      <div className="mt-4">
        <NetBarChart data={data} />
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>{data[0]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        <span className="text-cyan-300">Cyan</span> = net stock added · <span className="text-fuchsia-300">Magenta</span> = net stock sold/removed
      </p>
    </div>
  )
}

function OrdersOverTimeCard({ orders }: { orders: OrderRow[] }) {
  const [windowDays, setWindowDays] = useState<Window>('30')
  const days = useMemo(() => lastNDays(Number(windowDays)), [windowDays])

  const { countData, revenueData, totalCount, totalRevenue } = useMemo(() => {
    const cutoff = days[0]
    const counts = new Map<string, number>()
    const revenue = new Map<string, number>()
    let totalCount = 0
    let totalRevenue = 0
    for (const o of orders) {
      const created = new Date(o.created_at)
      if (created < cutoff) continue
      const key = dayKey(created)
      counts.set(key, (counts.get(key) ?? 0) + 1)
      revenue.set(key, (revenue.get(key) ?? 0) + o.total_eur)
      totalCount += 1
      totalRevenue += o.total_eur
    }
    return {
      countData: days.map((d) => ({ date: dayKey(d), label: dayLabel(d), value: counts.get(dayKey(d)) ?? 0 })),
      revenueData: days.map((d) => ({ date: dayKey(d), label: dayLabel(d), value: revenue.get(dayKey(d)) ?? 0 })),
      totalCount,
      totalRevenue,
    }
  }, [orders, days])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-fuchsia-200">
          <ShoppingCart className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Orders over time</p>
        </div>
        <WindowToggle value={windowDays} onChange={setWindowDays} />
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-zinc-400">
            {totalCount} order{totalCount === 1 ? '' : 's'}
          </p>
          <PositiveBarChart data={countData} color="#4ddcff" />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{formatCurrency(totalRevenue)} total value</p>
          <PositiveBarChart data={revenueData} color="#ff3fa3" />
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>{countData[0]?.label}</span>
        <span>{countData[countData.length - 1]?.label}</span>
      </div>
    </div>
  )
}

function TopSellingCard({ movements }: { movements: Movement[] }) {
  const [windowOpt, setWindowOpt] = useState<'7' | '30' | 'all'>('30')

  const ranked = useMemo(() => {
    const cutoff = windowOpt === 'all' ? null : lastNDays(Number(windowOpt))[0]
    const totals = new Map<string, { name: string; qty: number }>()
    for (const m of movements) {
      if (m.change_qty >= 0) continue
      if (cutoff && new Date(m.created_at) < cutoff) continue
      const entry = totals.get(m.product_id) ?? { name: m.product_name, qty: 0 }
      entry.qty += Math.abs(m.change_qty)
      totals.set(m.product_id, entry)
    }
    return Array.from(totals.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
  }, [movements, windowOpt])

  const max = Math.max(1, ...ranked.map((r) => r.qty))

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-200">
          <ArrowDownRight className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Top-selling products</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          {(['7', '30', 'all'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindowOpt(w)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                windowOpt === w ? 'bg-cyan-400/15 text-cyan-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {w === 'all' ? 'All time' : `${w}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {ranked.map((r, i) => (
          <div key={r.name + i} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-xs font-semibold text-zinc-500">#{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-white">{r.name}</p>
                <p className="shrink-0 text-sm font-semibold text-cyan-200">{r.qty} sold</p>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  style={{ width: `${(r.qty / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {ranked.length === 0 ? <p className="text-sm text-zinc-400">No sales recorded in this window.</p> : null}
      </div>
    </div>
  )
}

function LowStockFrequencyCard({ movements }: { movements: Movement[] }) {
  const ranked = useMemo(() => {
    const byProduct = new Map<string, Movement[]>()
    for (const m of movements) {
      const list = byProduct.get(m.product_id) ?? []
      list.push(m)
      byProduct.set(m.product_id, list)
    }

    const results: { name: string; count: number }[] = []
    for (const [, list] of byProduct) {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      let balance = 0
      let count = 0
      for (const m of list) {
        const prev = balance
        balance += m.change_qty
        const wasLow = prev > 0 && prev < LOW_STOCK_THRESHOLD
        const isLow = balance > 0 && balance < LOW_STOCK_THRESHOLD
        if (isLow && !wasLow) count += 1
      }
      if (count > 0) results.push({ name: list[0].product_name, count })
    }

    return results.sort((a, b) => b.count - a.count).slice(0, 8)
  }, [movements])

  const max = Math.max(1, ...ranked.map((r) => r.count))

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
      <div className="flex items-center gap-2 text-amber-200">
        <AlertTriangle className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em]">Low-stock frequency (all time)</p>
      </div>
      <p className="mt-1 text-xs text-zinc-500">How often each product has dipped below {LOW_STOCK_THRESHOLD} units — chronic under-stocking shows up here.</p>

      <div className="mt-4 space-y-2.5">
        {ranked.map((r, i) => (
          <div key={r.name + i} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-xs font-semibold text-zinc-500">#{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-white">{r.name}</p>
                <p className="shrink-0 text-sm font-semibold text-amber-200">
                  {r.count}× low
                </p>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
        {ranked.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <Package className="size-4" />
            No product has hit the low-stock threshold yet.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function NetBarChart({ data }: { data: { date: string; label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)))
  const barWidth = 100 / Math.max(data.length, 1)

  return (
    <svg viewBox="0 0 100 60" className="h-32 w-full" preserveAspectRatio="none">
      <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      {data.map((d, i) => {
        const h = (Math.abs(d.value) / max) * 27
        const x = i * barWidth + barWidth * 0.15
        const w = Math.max(barWidth * 0.7, 0.3)
        const y = d.value >= 0 ? 30 - h : 30
        const color = d.value >= 0 ? '#4ddcff' : '#ff3fa3'
        return <rect key={d.date} x={x} y={y} width={w} height={Math.max(h, d.value === 0 ? 0 : 0.6)} fill={color} rx="0.4" />
      })}
    </svg>
  )
}

function PositiveBarChart({ data, color }: { data: { date: string; label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const barWidth = 100 / Math.max(data.length, 1)

  return (
    <svg viewBox="0 0 100 44" className="h-24 w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.value / max) * 42
        const x = i * barWidth + barWidth * 0.15
        const w = Math.max(barWidth * 0.7, 0.3)
        const y = 44 - h
        return <rect key={d.date} x={x} y={y} width={w} height={Math.max(h, d.value === 0 ? 0 : 0.6)} fill={color} rx="0.4" opacity={0.85} />
      })}
    </svg>
  )
}
