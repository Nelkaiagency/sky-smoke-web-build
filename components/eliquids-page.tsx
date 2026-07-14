'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BadgeCheck, Droplet, Minus, MapPin, Phone, Plus, ShoppingBag, Store, Trash2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/shop'
import { formatCurrency } from '@/lib/format'
import { Toast, useToast } from '@/components/toast'
import { EliquidDetailModal, startingPrice, type Eliquid, type Variant } from '@/components/eliquid-detail-modal'

type CartLine = { variantId: string; qty: number; variant: Variant; eliquidName: string }

export function EliquidsPage({
  eliquids,
  shop,
  user,
  customerProfile,
}: {
  eliquids: Eliquid[]
  shop: { name: string; address: string | null; phone: string | null }
  user: { id: string; email: string } | null
  customerProfile: { full_name: string | null; phone: string | null } | null
}) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [selectedEliquid, setSelectedEliquid] = useState<Eliquid | null>(null)
  const [name, setName] = useState(customerProfile?.full_name ?? '')
  const [phone, setPhone] = useState(customerProfile?.phone ?? '')
  const [ageVerified, setAgeVerified] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<{ reference: string; total: number } | null>(null)
  const { message: toastMessage, show: showToast, dismiss: dismissToast } = useToast()

  const variantIndex = useMemo(() => {
    const map = new Map<string, { variant: Variant; eliquidName: string }>()
    for (const e of eliquids) {
      for (const v of e.eliquid_variants) {
        map.set(v.id, { variant: v, eliquidName: e.flavor_name })
      }
    }
    return map
  }, [eliquids])

  const cartLines: CartLine[] = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, qty]) => {
        const info = variantIndex.get(variantId)!
        return { variantId, qty, variant: info.variant, eliquidName: info.eliquidName }
      })
  }, [cart, variantIndex])

  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0)
  const subtotal = cartLines.reduce((sum, l) => sum + l.variant.price * l.qty, 0)

  const setLineQty = (variantId: string, qty: number, maxStock: number) => {
    setCart((current) => {
      const next = { ...current }
      const clamped = Math.max(0, Math.min(qty, maxStock))
      if (clamped === 0) delete next[variantId]
      else next[variantId] = clamped
      return next
    })
  }

  const addToCart = (variantId: string, qty: number, maxStock: number) => {
    setCart((current) => {
      const next = { ...current }
      const existing = next[variantId] ?? 0
      next[variantId] = Math.min(existing + qty, maxStock)
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim() || !phone.trim()) {
      setError('Please add your name and phone number before submitting your pre-order.')
      return
    }
    if (!ageVerified) {
      setError('You must confirm you are over 18 to collect from the shop.')
      return
    }
    if (cartCount === 0) {
      setError('Add at least one e-liquid before submitting your pre-order.')
      return
    }

    setError('')
    setSubmitting(true)
    const supabase = createClient()

    // generated client-side rather than read back via .select() — anon has no SELECT
    // policy on age_verifications (would otherwise leak every guest's phone number)
    const ageVerificationId = crypto.randomUUID()
    const { error: ageError } = await supabase
      .from('age_verifications')
      .insert({ id: ageVerificationId, shop_id: SHOP_ID, customer_phone: phone.trim(), verified: true, method: 'self_declared' })

    if (ageError) {
      setError('Your order could not be sent right now. Please call the shop directly.')
      setSubmitting(false)
      return
    }

    const orderItems = cartLines.map((line) => ({
      id: line.variantId,
      name: `${line.eliquidName} — ${line.variant.bottle_size}, ${line.variant.nicotine_strength}`,
      price_eur: line.variant.price,
      quantity: line.qty,
    }))

    const { error: orderError } = await supabase.from('orders').insert({
      shop_id: SHOP_ID,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      items: orderItems,
      total_eur: Math.round(subtotal * 100) / 100,
      subtotal_before_discount: Math.round(subtotal * 100) / 100,
      discount_applied_percent: 0,
      age_verification_id: ageVerificationId,
      customer_id: user?.id ?? null,
      source: 'website',
    })

    setSubmitting(false)

    if (orderError) {
      setError('Your order could not be sent right now. Please call the shop directly.')
      return
    }

    setReceipt({ reference: `SKY-${Date.now().toString().slice(-6)}`, total: subtotal })
    showToast('Pre-order received!')
    setCart({})
    if (!user) {
      setName('')
      setPhone('')
    }
    setAgeVerified(false)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(77,220,255,0.2),_transparent_40%),linear-gradient(135deg,_#04070d_0%,_#090d16_55%,_#03050a_100%)] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
                <ArrowLeft className="size-4" />
                Back to shop
              </Link>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  E-Liquids
                </span>
                <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
                  Click &amp; Collect
                </span>
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">E-Liquids</h1>
              <p className="mt-3 text-lg text-zinc-300">
                Pick your flavour, bottle size, and nicotine strength. We&apos;ll hold it behind the counter for collection.
              </p>
            </div>

            {!user ? (
              <Link
                href="/account/login"
                className="flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/20"
              >
                <User className="size-4" />
                Sign in for faster checkout
              </Link>
            ) : null}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#070b14]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">All flavours</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{eliquids.length} in stock</h2>
              </div>
              <div className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1.5 text-sm text-fuchsia-200">
                {cartCount} item{cartCount === 1 ? '' : 's'} in pre-order
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {eliquids.map((eliquid) => (
                <article
                  key={eliquid.id}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30 hover:bg-white/8"
                  onClick={() => setSelectedEliquid(eliquid)}
                >
                  <div className="rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-fuchsia-500 p-[1px]">
                    <div className="rounded-[11px] bg-[#060811] p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                          {eliquid.brand}
                        </span>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium text-cyan-200">
                          {eliquid.eliquid_variants.length} option{eliquid.eliquid_variants.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="mb-3 flex h-24 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                        <Droplet className="size-10 text-cyan-300/70" />
                      </div>
                      <h4 className="text-lg font-semibold text-white">{eliquid.flavor_name}</h4>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{eliquid.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xl font-semibold text-white">From {formatCurrency(startingPrice(eliquid))}</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Choose size &amp; strength</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200">
                          <ShoppingBag className="size-4" />
                          Select
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {eliquids.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400 md:col-span-2">
                  No e-liquids available right now — check back soon.
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-[#050811]/95 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Pre-order desk</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Collect from the counter</h2>
                </div>
                <div className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 p-2 text-fuchsia-200">
                  <Store className="size-5" />
                </div>
              </div>

              {cartLines.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">Your order</p>
                    <p className="text-sm text-zinc-300">
                      {cartCount} item{cartCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {cartLines.map((line) => (
                      <div key={line.variantId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{line.eliquidName}</p>
                          <p className="text-xs text-zinc-500">
                            {line.variant.bottle_size}, {line.variant.nicotine_strength} · x{line.qty}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                            <button
                              type="button"
                              onClick={() => setLineQty(line.variantId, line.qty - 1, line.variant.stock_quantity)}
                              className="rounded-full p-1 text-zinc-300"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-5 text-center text-xs font-semibold text-white">{line.qty}</span>
                            <button
                              type="button"
                              disabled={line.qty >= line.variant.stock_quantity}
                              onClick={() => setLineQty(line.variantId, line.qty + 1, line.variant.stock_quantity)}
                              className="rounded-full p-1 text-zinc-300 disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLineQty(line.variantId, 0, line.variant.stock_quantity)}
                            className="rounded-full border border-white/10 p-1.5 text-zinc-400 transition hover:text-rose-300"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <p className="text-sm font-semibold text-cyan-200">{formatCurrency(line.variant.price * line.qty)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                    <span className="text-zinc-400">Estimated total</span>
                    <span className="text-lg font-semibold text-white">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                  Pick a flavour and choose your bottle size &amp; strength to get started.
                </div>
              )}

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="eliquid-name">
                    Name
                  </label>
                  <input
                    id="eliquid-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
                    placeholder="Alex Murphy"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="eliquid-phone">
                    Phone number
                  </label>
                  <input
                    id="eliquid-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
                    placeholder="085 805 1510"
                  />
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                  <input
                    checked={ageVerified}
                    onChange={(e) => setAgeVerified(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-white/20 bg-transparent"
                    type="checkbox"
                  />
                  <span>I confirm I am 18+ and happy for the shop to hold this order for collection.</span>
                </label>

                {error ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}

                <button
                  type="submit"
                  disabled={submitting || cartCount === 0}
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    cartCount === 0
                      ? 'cursor-not-allowed bg-white/5 text-zinc-500'
                      : submitting
                        ? 'cursor-not-allowed bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 opacity-60'
                        : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 hover:brightness-110'
                  }`}
                >
                  {cartCount === 0 ? 'Add items to pre-order' : submitting ? 'Submitting…' : 'Submit Pre-Order for Collection'}
                  {cartCount > 0 ? <ArrowRight className="size-4" /> : null}
                </button>
              </form>
            </div>

            {receipt ? (
              <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-2 text-emerald-200">
                  <BadgeCheck className="size-5" />
                  <p className="font-semibold">Pre-order received</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-emerald-50">
                  <p>Reference: {receipt.reference}</p>
                  <p>Total: {formatCurrency(receipt.total)}</p>
                  <p>Your e-liquids are being held behind the counter and we&apos;ll call when they are ready.</p>
                </div>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Contact us</p>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                {shop.address ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 text-fuchsia-400" />
                    {shop.address}
                  </p>
                ) : null}
                {shop.phone ? (
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 text-cyan-400" />
                    {shop.phone}
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {selectedEliquid ? (
        <EliquidDetailModal
          eliquid={selectedEliquid}
          onClose={() => setSelectedEliquid(null)}
          onAdd={(variantId, qty, maxStock) => {
            addToCart(variantId, qty, maxStock)
            setSelectedEliquid(null)
          }}
        />
      ) : null}

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </main>
  )
}
