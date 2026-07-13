'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Minus, Pencil, Plus, PlusCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format'
import { SHOP_ID } from '@/lib/shop'
import { Toast, useToast } from '@/components/toast'
import { EditProductModal } from '@/components/admin/edit-product-modal'

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [highlightId, setHighlightId] = useState<string | null>(searchParams.get('highlight'))
  const { message: toastMessage, show: showToast, dismiss: dismissToast } = useToast()

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

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
      list = list.filter((p) => {
        const categoryName = (p.category_id && categoryById.get(p.category_id)) || ''
        return p.name.toLowerCase().includes(query) || categoryName.toLowerCase().includes(query)
      })
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
  }, [products, categoryFilter, search, sortBy, categoryById])

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
    <div className="space-y-4">
      <div className="sticky top-[104px] z-30 -mx-4 border-b border-white/5 bg-[#04070d]/95 px-4 py-3 backdrop-blur sm:top-[108px] sm:mx-0 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product or category…"
              className="w-full rounded-full border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="flex shrink-0 items-center justify-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
          >
            <PlusCircle className="size-4" />
            {showAddForm ? 'Close' : 'Add product'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {filteredProducts.length} of {products.length} product{products.length === 1 ? '' : 's'}
        </p>
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

      {showAddForm ? (
        <AddProductForm
          categories={categories}
          onDone={() => {
            setShowAddForm(false)
            router.refresh()
            showToast('Product added')
          }}
        />
      ) : null}

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
            onEdit={() => setEditingProduct(product)}
            notify={showToast}
          />
        ))}
        {filteredProducts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
            {products.length === 0 ? 'No products yet. Add your first one above.' : 'No products match your search or filter.'}
          </p>
        ) : null}
      </div>

      {editingProduct ? (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null)
            router.refresh()
            showToast('Product updated')
          }}
        />
      ) : null}

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </div>
  )
}

function StockRow({
  product,
  busy,
  highlighted,
  registerRef,
  onAdjust,
  onEdit,
  notify,
}: {
  product: Product
  busy: boolean
  highlighted: boolean
  registerRef: (el: HTMLDivElement | null) => void
  onAdjust: (delta: number, reason: string, source?: string) => Promise<boolean>
  onEdit: () => void
  notify: (text: string, tone?: 'success' | 'error') => void
}) {
  const isLow = product.stock_qty < 5

  return (
    <div
      ref={registerRef}
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors ${highlighted ? 'animate-highlight-pulse' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium text-white">{product.name}</p>
            <button
              type="button"
              onClick={onEdit}
              title="Edit product"
              className="shrink-0 rounded-full p-1 text-zinc-500 transition hover:bg-white/10 hover:text-cyan-300"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
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

      <div className="mt-3">
        <QtyControl product={product} busy={busy} onAdjust={onAdjust} notify={notify} />
      </div>
    </div>
  )
}

function QtyControl({
  product,
  busy,
  onAdjust,
  notify,
}: {
  product: Product
  busy: boolean
  onAdjust: (delta: number, reason: string, source?: string) => Promise<boolean>
  notify: (text: string, tone?: 'success' | 'error') => void
}) {
  const [value, setValue] = useState(String(product.stock_qty))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setValue(String(product.stock_qty))
  }, [product.stock_qty])

  const commit = async () => {
    focusedRef.current = false
    if (value.trim() === '') {
      setValue(String(product.stock_qty))
      return
    }
    const next = Number(value)
    if (!Number.isInteger(next) || next < 0) {
      notify('Enter a non-negative whole number.', 'error')
      setValue(String(product.stock_qty))
      return
    }
    const diff = next - product.stock_qty
    if (diff === 0) return
    const ok = await onAdjust(diff, 'manual_correction', 'admin_direct_edit')
    notify(ok ? 'Stock updated' : 'Could not update stock', ok ? 'success' : 'error')
    if (!ok) setValue(String(product.stock_qty))
  }

  const quickAdjust = async (delta: number) => {
    const ok = await onAdjust(delta, delta > 0 ? 'manual +1' : 'manual -1')
    notify(ok ? 'Stock updated' : 'Could not update stock', ok ? 'success' : 'error')
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => quickAdjust(-1)}
        className="rounded-full p-2 text-zinc-300 transition hover:text-white disabled:opacity-50"
      >
        <Minus className="size-4" />
      </button>

      <input
        type="number"
        min={0}
        step={1}
        value={value}
        disabled={busy}
        onFocus={() => {
          focusedRef.current = true
        }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            focusedRef.current = false
            setValue(String(product.stock_qty))
            e.currentTarget.blur()
          }
        }}
        className="w-16 rounded-md border border-white/10 bg-black/40 px-1.5 py-1.5 text-center text-sm font-semibold text-white focus:border-cyan-400/40 focus:outline-none disabled:opacity-50"
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => quickAdjust(1)}
        className="rounded-full p-2 text-zinc-300 transition hover:text-white disabled:opacity-50"
      >
        <Plus className="size-4" />
      </button>
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
