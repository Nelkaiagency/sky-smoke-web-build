'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { SHOP_ID } from '@/lib/shop'

type Product = {
  id: string
  name: string
  price_eur: number
  stock_qty: number
  active: boolean | null
  category_id: string | null
  age_restricted: boolean | null
}

type Category = { id: string; name: string }

export function StockTable({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const adjustStock = async (productId: string, changeQty: number, reason: string) => {
    setBusyId(productId)
    const supabase = createClient()
    await supabase.from('stock_movements').insert({
      product_id: productId,
      shop_id: SHOP_ID,
      change_qty: changeQty,
      reason,
      source: 'admin_manual',
    })
    setBusyId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{products.length} product{products.length === 1 ? '' : 's'}</p>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
        >
          <PlusCircle className="size-4" />
          {showAddForm ? 'Close' : 'Add product'}
        </button>
      </div>

      {showAddForm ? (
        <AddProductForm
          categories={categories}
          onDone={() => {
            setShowAddForm(false)
            router.refresh()
          }}
        />
      ) : null}

      <div className="space-y-3">
        {products.map((product) => (
          <StockRow
            key={product.id}
            product={product}
            busy={busyId === product.id}
            onAdjust={(delta, reason) => adjustStock(product.id, delta, reason)}
          />
        ))}
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            No products yet. Add your first one above.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function StockRow({
  product,
  busy,
  onAdjust,
}: {
  product: Product
  busy: boolean
  onAdjust: (delta: number, reason: string) => void
}) {
  const [manualQty, setManualQty] = useState('')

  const isLow = product.stock_qty < 5

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{product.name}</p>
          <p className="mt-1 text-sm text-zinc-400">{formatCurrency(product.price_eur)}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
            isLow ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
          }`}
        >
          {product.stock_qty} in stock
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdjust(-1, 'manual -1')}
            className="rounded-full p-2 text-zinc-300 transition hover:text-white disabled:opacity-50"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-semibold text-white">{product.stock_qty}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => onAdjust(1, 'manual +1')}
            className="rounded-full p-2 text-zinc-300 transition hover:text-white disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const qty = Number(manualQty)
            if (!Number.isFinite(qty) || qty === 0) return
            onAdjust(qty, 'manual entry')
            setManualQty('')
          }}
        >
          <input
            type="number"
            placeholder="+/- qty"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            className="w-24 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/20 disabled:opacity-50"
          >
            Apply
          </button>
        </form>
      </div>
    </div>
  )
}

function AddProductForm({ categories, onDone }: { categories: Category[]; onDone: () => void }) {
  const [name, setName] = useState('')
  const [priceEur, setPriceEur] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [initialStock, setInitialStock] = useState('0')
  const [ageRestricted, setAgeRestricted] = useState(true)
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const price = Number(priceEur)
    const stock = Number(initialStock) || 0
    if (!name.trim() || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid name and price.')
      return
    }

    setPending(true)
    const supabase = createClient()

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        shop_id: SHOP_ID,
        name: name.trim(),
        price_eur: price,
        category_id: categoryId || null,
        age_restricted: ageRestricted,
        description: description.trim() || null,
      })
      .select('id')
      .single()

    if (insertError || !product) {
      setError(insertError?.message ?? 'Could not create product.')
      setPending(false)
      return
    }

    if (stock !== 0) {
      await supabase.from('stock_movements').insert({
        product_id: product.id,
        shop_id: SHOP_ID,
        change_qty: stock,
        reason: 'initial stock',
        source: 'admin_manual',
      })
    }

    setPending(false)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Price (EUR)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={priceEur}
            onChange={(e) => setPriceEur(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">Initial stock</label>
          <input
            type="number"
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={ageRestricted}
          onChange={(e) => setAgeRestricted(e.target.checked)}
          className="size-4 rounded border-white/20 bg-transparent"
        />
        Age-restricted (18+)
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? 'Adding…' : 'Add product'}
      </button>
    </form>
  )
}
