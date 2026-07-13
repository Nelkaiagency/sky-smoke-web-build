'use client'

import { useState } from 'react'
import { CircleX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = {
  id: string
  name: string
  price_eur: number
  category_id: string | null
}

type Category = { id: string; name: string }

export function EditProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product.name)
  const [priceEur, setPriceEur] = useState(String(product.price_eur))
  const [categoryId, setCategoryId] = useState(product.category_id ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const price = Number(priceEur)
    if (!name.trim() || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid name and price.')
      return
    }

    setError('')
    setPending(true)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('products')
      .update({ name: name.trim(), price_eur: price, category_id: categoryId || null })
      .eq('id', product.id)
    setPending(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#060811] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Edit product</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{product.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:text-white">
            <CircleX className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
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
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-cyan-400/40 focus:outline-none"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
