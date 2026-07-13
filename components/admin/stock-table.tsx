'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Minus, Plus, PlusCircle, Search } from 'lucide-react'
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

type SortOption = 'name-asc' | 'name-desc' | 'stock-desc' | 'stock-asc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'A to Z' },
  { value: 'name-desc', label: 'Z to A' },
  { value: 'stock-desc', label: 'Highest stock first' },
  { value: 'stock-asc', label: 'Lowest stock first' },
]

export function StockTable({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [highlightId, setHighlightId] = useState<string | null>(searchParams.get('highlight'))

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const adjustStock = async (productId: string, changeQty: number, reason: string, source = 'admin_manual') => {
    setBusyId(productId)
    const supabase = createClient()
    const { error } = await supabase.from('stock_movements').insert({
      product_id: productId,
      shop_id: SHOP_ID,
      change_qty: changeQty,
      reason,
      source,
    })
    setBusyId(null)
    router.refresh()
    return !error
  }

  const filteredProducts = useMemo(() => {
    let list = products
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category_id === categoryFilter)
    }
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter((p) => p.name.toLowerCase().includes(query))
    }
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'stock-desc':
          return b.stock_qty - a.stock_qty
        case 'stock-asc':
          return a.stock_qty - b.stock_qty
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [products, categoryFilter, search, sortBy])

  useEffect(() => {
    if (!highlightId) return
    const el = rowRefs.current.get(highlightId)
    if (el) {
      const rect = el.getBoundingClientRect()
      const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
      if (!fullyVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    const timeout = setTimeout(() => setHighlightId(null), 3000)
    const clearOnInteract = () => setHighlightId(null)
    window.addEventListener('pointerdown', clearOnInteract)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('pointerdown', clearOnInteract)
    }
  }, [highlightId])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {filteredProducts.length} of {products.length} product{products.length === 1 ? '' : 's'}
        </p>
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
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400/40 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                categoryFilter === 'all'
                  ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:border-cyan-400/20 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  categoryFilter === c.id
                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:border-cyan-400/20 hover:text-zinc-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <StockRow
            key={product.id}
            product={product}
            busy={busyId === product.id}
            highlighted={highlightId === product.id}
            registerRef={(el) => {
              if (el) rowRefs.current.set(product.id, el)
              else rowRefs.current.delete(product.id)
            }}
            onAdjust={(delta, reason, source) => adjustStock(product.id, delta, reason, source)}
          />
        ))}
        {filteredProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            {products.length === 0 ? 'No products yet. Add your first one above.' : 'No products match your search or filter.'}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function StockRow({
  product,
  busy,
  highlighted,
  registerRef,
  onAdjust,
}: {
  product: Product
  busy: boolean
  highlighted: boolean
  registerRef: (el: HTMLDivElement | null) => void
  onAdjust: (delta: number, reason: string, source?: string) => Promise<boolean>
}) {
  const [manualQty, setManualQty] = useState('')
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isLow = product.stock_qty < 5

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (!editing) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        cancelEdit()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const startEdit = () => {
    if (busy) return
    setEditing(true)
    setEditValue(String(product.stock_qty))
    setEditError('')
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditError('')
  }

  const confirmEdit = async () => {
    if (editValue.trim() === '') {
      setEditError('Enter a non-negative whole number.')
      return
    }
    const val = Number(editValue)
    if (!Number.isInteger(val) || val < 0) {
      setEditError('Enter a non-negative whole number.')
      return
    }
    const diff = val - product.stock_qty
    if (diff === 0) {
      setEditing(false)
      return
    }
    setEditError('')
    const ok = await onAdjust(diff, 'manual_correction', 'admin_direct_edit')
    if (ok) {
      setEditing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
    } else {
      setEditError('Could not update stock. Try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        registerRef(el)
      }}
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors ${highlighted ? 'animate-highlight-pulse' : ''}`}
    >
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
            disabled={busy || editing}
            onClick={() => onAdjust(-1, 'manual -1')}
            className="rounded-full p-2 text-zinc-300 transition hover:text-white disabled:opacity-50"
          >
            <Minus className="size-4" />
          </button>

          {editing ? (
            <span className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                min={0}
                step={1}
                value={editValue}
                disabled={busy}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-14 rounded-md border border-cyan-400/40 bg-black/60 px-1.5 py-1 text-center text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              />
              <button
                type="button"
                disabled={busy}
                onClick={confirmEdit}
                title="Confirm exact count"
                className="rounded-full p-1.5 text-emerald-300 transition hover:bg-emerald-400/10 hover:text-emerald-200 disabled:opacity-50"
              >
                <Check className="size-4" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={startEdit}
              title="Click to set exact stock count"
              className={`flex min-w-8 items-center justify-center gap-1 rounded px-1 text-center text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50 ${
                showSuccess ? 'text-emerald-300' : 'text-white'
              }`}
            >
              {product.stock_qty}
              {showSuccess ? <Check className="size-3 text-emerald-300" /> : null}
            </button>
          )}

          <button
            type="button"
            disabled={busy || editing}
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

      {editError ? <p className="mt-2 text-xs text-rose-300">{editError}</p> : null}
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
