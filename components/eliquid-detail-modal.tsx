'use client'

import { useEffect, useMemo, useState } from 'react'
import { CircleX, Minus, Plus, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { stockLabel } from '@/lib/stock-label'

export type Variant = {
  id: string
  bottle_size: string
  nicotine_strength: string
  price: number
  stock_quantity: number
  sku: string | null
}

export type Eliquid = {
  id: string
  flavor_name: string
  brand: string
  description: string | null
  image_url: string | null
  eliquid_variants: Variant[]
}

export const BOTTLE_SIZE_ORDER = ['10ml', '50ml', '100ml Shortfill']
export const NICOTINE_ORDER = ['0mg', '3mg', '6mg', '12mg', '20mg']

export function sortByOrder(values: string[], order: string[]) {
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}

export function startingPrice(eliquid: Eliquid) {
  return Math.min(...eliquid.eliquid_variants.map((v) => v.price))
}

export function EliquidDetailModal({
  eliquid,
  onClose,
  onAdd,
}: {
  eliquid: Eliquid
  onClose: () => void
  onAdd: (variantId: string, qty: number, maxStock: number) => void
}) {
  const bottleSizes = useMemo(
    () => sortByOrder(Array.from(new Set(eliquid.eliquid_variants.map((v) => v.bottle_size))), BOTTLE_SIZE_ORDER),
    [eliquid],
  )
  const [bottleSize, setBottleSize] = useState(bottleSizes[0])

  const nicotineOptions = useMemo(
    () =>
      sortByOrder(
        Array.from(new Set(eliquid.eliquid_variants.filter((v) => v.bottle_size === bottleSize).map((v) => v.nicotine_strength))),
        NICOTINE_ORDER,
      ),
    [eliquid, bottleSize],
  )
  const [nicotine, setNicotine] = useState(nicotineOptions[0])
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!nicotineOptions.includes(nicotine)) {
      setNicotine(nicotineOptions[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottleSize, nicotineOptions])

  const selectedVariant = eliquid.eliquid_variants.find((v) => v.bottle_size === bottleSize && v.nicotine_strength === nicotine)
  const stock = stockLabel(selectedVariant?.stock_quantity ?? 0)
  const inStock = stock.tone !== 'out'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#060811] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">{eliquid.brand}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{eliquid.flavor_name}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:text-white">
            <CircleX className="size-5" />
          </button>
        </div>

        {eliquid.description ? <p className="mt-4 text-sm leading-7 text-zinc-300">{eliquid.description}</p> : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Bottle size</label>
            <select
              value={bottleSize}
              onChange={(e) => setBottleSize(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            >
              {bottleSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Nicotine strength</label>
            <select
              value={nicotine}
              onChange={(e) => setNicotine(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            >
              {nicotineOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xl font-semibold text-white">{selectedVariant ? formatCurrency(selectedVariant.price) : '—'}</p>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                stock.tone === 'out'
                  ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
                  : stock.tone === 'low'
                    ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                    : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
              }`}
            >
              {stock.label}
            </span>
          </div>

          {inStock ? (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="rounded-full p-2 text-zinc-300 transition hover:text-white"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-8 text-center text-sm font-semibold text-white">{qty}</span>
                <button
                  type="button"
                  disabled={selectedVariant ? qty >= selectedVariant.stock_quantity : true}
                  onClick={() => setQty((q) => q + 1)}
                  className="rounded-full p-2 text-zinc-300 transition hover:text-white disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!selectedVariant || !inStock}
          onClick={() => selectedVariant && onAdd(selectedVariant.id, qty, selectedVariant.stock_quantity)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/5 disabled:bg-none disabled:text-zinc-500"
        >
          <ShoppingBag className="size-4" />
          {inStock ? 'Add to Pre-Order' : 'Out of stock'}
        </button>
      </div>
    </div>
  )
}
