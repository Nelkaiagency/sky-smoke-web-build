'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { SHOP_ID } from '@/lib/shop'

type Tier = {
  id: string
  min_order_total: number
  discount_percent: number
  active: boolean
}

export function DiscountTiersTable({ tiers }: { tiers: Tier[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const toggleActive = async (tier: Tier) => {
    setBusyId(tier.id)
    const supabase = createClient()
    await supabase.from('discount_tiers').update({ active: !tier.active }).eq('id', tier.id)
    setBusyId(null)
    router.refresh()
  }

  const remove = async (tier: Tier) => {
    setBusyId(tier.id)
    const supabase = createClient()
    await supabase.from('discount_tiers').delete().eq('id', tier.id)
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
        >
          <PlusCircle className="size-4" />
          {showForm ? 'Close' : 'New tier'}
        </button>
      </div>

      {showForm ? (
        <NewTierForm
          onDone={() => {
            setShowForm(false)
            router.refresh()
          }}
        />
      ) : null}

      <div className="space-y-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">
                Spend {formatCurrency(tier.min_order_total)}+, get {tier.discount_percent}% off
              </p>
              <span
                className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  tier.active ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-500'
                }`}
              >
                {tier.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busyId === tier.id}
                onClick={() => toggleActive(tier)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-cyan-400/20 disabled:opacity-50"
              >
                {tier.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                disabled={busyId === tier.id}
                onClick={() => remove(tier)}
                className="rounded-full border border-white/10 p-2 text-zinc-400 transition hover:text-rose-300 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {tiers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            No discount tiers yet.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function NewTierForm({ onDone }: { onDone: () => void }) {
  const [minOrderTotal, setMinOrderTotal] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const min = Number(minOrderTotal)
    const pct = Number(discountPercent)
    if (!Number.isFinite(min) || min < 0 || !Number.isFinite(pct) || pct <= 0 || pct > 100) {
      setError('Enter a valid minimum spend and percentage (1-100).')
      return
    }

    setPending(true)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('discount_tiers').insert({
      shop_id: SHOP_ID,
      min_order_total: min,
      discount_percent: pct,
    })
    setPending(false)

    if (insertError) {
      setError(insertError.message)
      return
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Minimum spend (EUR)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={minOrderTotal}
            onChange={(e) => setMinOrderTotal(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Discount %</label>
          <input
            required
            type="number"
            step="1"
            min="1"
            max="100"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save tier'}
      </button>
    </form>
  )
}
