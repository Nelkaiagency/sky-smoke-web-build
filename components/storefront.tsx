'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleX,
  Droplet,
  LogOut,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/shop'
import { formatCurrency } from '@/lib/format'
import { bestDiscountPercent, type DiscountTier } from '@/lib/discount'
import { stockLabel } from '@/lib/stock-label'
import { Toast, useToast } from '@/components/toast'
import { EliquidDetailModal, startingPrice, type Eliquid, type Variant } from '@/components/eliquid-detail-modal'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkoldpve'

type Product = {
  id: string
  name: string
  description: string | null
  price_eur: number
  stock_qty: number
  category_id: string | null
  age_restricted: boolean | null
}

type Category = { id: string; name: string; sort_order: number | null }

type CartItem = Product & { quantity: number }

type Receipt = {
  reference: string
  name: string
  items: CartItem[]
  subtotal: number
  discountPercent: number
  total: number
}

type EliquidCartLine = { variantId: string; qty: number; variant: Variant; eliquidName: string }

const ACCENTS = [
  'from-cyan-400 via-sky-500 to-fuchsia-500',
  'from-fuchsia-500 via-purple-500 to-indigo-500',
  'from-emerald-400 via-cyan-400 to-sky-500',
  'from-orange-400 via-rose-500 to-fuchsia-500',
  'from-violet-500 via-fuchsia-500 to-pink-500',
  'from-slate-500 via-zinc-500 to-stone-600',
  'from-amber-400 via-yellow-500 to-orange-500',
]

export function Storefront({
  products,
  categories,
  discountTiers,
  shop,
  user,
  customerProfile,
  eliquids,
}: {
  products: Product[]
  categories: Category[]
  discountTiers: DiscountTier[]
  shop: { name: string; address: string | null; phone: string | null }
  user: { id: string; email: string } | null
  customerProfile: { full_name: string | null; phone: string | null } | null
  eliquids: Eliquid[]
}) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [eliquidCart, setEliquidCart] = useState<Record<string, number>>({})
  const [name, setName] = useState(customerProfile?.full_name ?? '')
  const [phone, setPhone] = useState(customerProfile?.phone ?? '')
  const [ageVerified, setAgeVerified] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id ?? '')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedEliquid, setSelectedEliquid] = useState<Eliquid | null>(null)
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(new Date())
  const { message: toastMessage, show: showToast, dismiss: dismissToast } = useToast()

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  const isOpen = now.getHours() >= 10 && now.getHours() < 23
  const hoursLabel = isOpen ? 'Open Now — Closes 11 PM' : 'Closed Now — Reopens at 10 AM'

  const productIndex = useMemo(() => new Map(products.map((p, i) => [p.id, i])), [products])

  const cartItems: CartItem[] = useMemo(() => {
    return products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] }))
  }, [cart, products])

  const variantIndex = useMemo(() => {
    const map = new Map<string, { variant: Variant; eliquidName: string }>()
    for (const e of eliquids) {
      for (const v of e.eliquid_variants) {
        map.set(v.id, { variant: v, eliquidName: e.flavor_name })
      }
    }
    return map
  }, [eliquids])

  const eliquidCartLines: EliquidCartLine[] = useMemo(() => {
    return Object.entries(eliquidCart)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, qty]) => {
        const info = variantIndex.get(variantId)!
        return { variantId, qty, variant: info.variant, eliquidName: info.eliquidName }
      })
  }, [eliquidCart, variantIndex])

  const eliquidCartCount = eliquidCartLines.reduce((sum, l) => sum + l.qty, 0)
  const eliquidSubtotal = eliquidCartLines.reduce((sum, l) => sum + l.variant.price * l.qty, 0)

  const productSubtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price_eur * item.quantity, 0), [cartItems])
  const subtotal = productSubtotal + eliquidSubtotal
  const discountPercent = useMemo(() => bestDiscountPercent(discountTiers, subtotal), [discountTiers, subtotal])
  const total = useMemo(() => subtotal * (1 - discountPercent / 100), [subtotal, discountPercent])

  const nextTier = useMemo(() => {
    const upcoming = discountTiers
      .filter((t) => t.active && t.min_order_total > subtotal)
      .sort((a, b) => a.min_order_total - b.min_order_total)
    return upcoming[0]
  }, [discountTiers, subtotal])

  const cartCount = useMemo(() => Object.values(cart).reduce((sum, count) => sum + count, 0), [cart])
  const combinedCartCount = cartCount + eliquidCartCount
  const visibleProducts = useMemo(() => products.filter((p) => p.category_id === selectedCategory), [products, selectedCategory])

  const setEliquidLineQty = (variantId: string, qty: number, maxStock: number) => {
    setEliquidCart((current) => {
      const next = { ...current }
      const clamped = Math.max(0, Math.min(qty, maxStock))
      if (clamped === 0) delete next[variantId]
      else next[variantId] = clamped
      return next
    })
  }

  const addEliquidToCart = (variantId: string, qty: number, maxStock: number) => {
    setEliquidCart((current) => {
      const next = { ...current }
      const existing = next[variantId] ?? 0
      next[variantId] = Math.min(existing + qty, maxStock)
      return next
    })
  }

  const removeEliquidFromCart = (variantId: string) => {
    setEliquidCart((current) => {
      const next = { ...current }
      delete next[variantId]
      return next
    })
  }

  const addToCart = (product: Product) => {
    if (product.stock_qty <= (cart[product.id] ?? 0)) return
    setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))
    setError('')
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const next = { ...current }
      const currentQty = next[productId] ?? 0
      const updatedQty = currentQty + delta
      if (updatedQty <= 0) {
        delete next[productId]
      } else {
        next[productId] = updatedQty
      }
      return next
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim() || !phone.trim()) {
      setError('Please add your name and phone number before placing the order.')
      return
    }
    if (!ageVerified) {
      setError('You must confirm you are over 18 to collect from the shop.')
      return
    }
    if (combinedCartCount === 0) {
      setError('Add at least one item before submitting your pre-order.')
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
      setError('Your order could not be sent right now. Please call the shop directly on 085 805 1510.')
      setSubmitting(false)
      return
    }

    const orderItems = [
      ...cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        price_eur: item.price_eur,
        quantity: item.quantity,
      })),
      ...eliquidCartLines.map((line) => ({
        product_id: line.variantId,
        name: `${line.eliquidName} — ${line.variant.bottle_size}, ${line.variant.nicotine_strength}`,
        price_eur: line.variant.price,
        quantity: line.qty,
      })),
    ]

    const { error: orderError } = await supabase.from('orders').insert({
      shop_id: SHOP_ID,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      items: orderItems,
      total_eur: Math.round(total * 100) / 100,
      subtotal_before_discount: Math.round(subtotal * 100) / 100,
      discount_applied_percent: discountPercent,
      age_verification_id: ageVerificationId,
      customer_id: user?.id ?? null,
      source: 'website',
    })

    setSubmitting(false)

    if (orderError) {
      setError('Your order could not be sent right now. Please call the shop directly on 085 805 1510.')
      return
    }

    // Supabase is the source of truth for the order; this is a non-blocking copy for email notification/backup.
    fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        age_verified: ageVerified,
        items: orderItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price_eur, total: item.price_eur * item.quantity })),
        subtotal,
        discount_percent: discountPercent,
        total_order_cost: total,
        _subject: `Sky Smoke 1 Pre-Order from ${name.trim()}`,
      }),
    }).catch(() => {})

    setReceipt({
      reference: `SKY-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      items: cartItems,
      subtotal,
      discountPercent,
      total,
    })
    showToast('Pre-order received!')
    setCart({})
    setEliquidCart({})
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
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  Cork Click & Collect
                </span>
                <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-fuchsia-200">
                  Local Pickup
                </span>
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{shop.name}</h1>
              <p className="mt-3 text-lg text-zinc-300">
                Fast collection, dependable stock, and a no-fuss pre-order flow for the shop on Maylor Street.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-zinc-300">
                {shop.address ? (
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-fuchsia-400" />
                    {shop.address}
                  </span>
                ) : null}
                {shop.phone ? (
                  <span className="flex items-center gap-2">
                    <Phone className="size-4 text-cyan-400" />
                    {shop.phone}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                {hoursLabel}
              </div>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/20"
                  >
                    <User className="size-4" />
                    My orders
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400 transition hover:text-rose-200"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/account/login"
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/20"
                >
                  <User className="size-4" />
                  Sign in for faster checkout
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-[#070b14]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Click & Collect Pre-Order</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">What&apos;s in stock right now</h2>
                </div>
                <div className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1.5 text-sm text-fuchsia-200">
                  {cartCount} item{cartCount === 1 ? '' : 's'} in pre-order
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = selectedCategory === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${isActive ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-zinc-400 hover:border-cyan-400/20 hover:text-zinc-200'}`}
                    >
                      {category.name}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 space-y-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">
                    {categories.find((c) => c.id === selectedCategory)?.name}
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleProducts.map((product) => {
                    const quantity = cart[product.id] ?? 0
                    const accent = ACCENTS[(productIndex.get(product.id) ?? 0) % ACCENTS.length]
                    const stock = stockLabel(product.stock_qty)
                    const outOfStock = stock.tone === 'out'
                    return (
                      <article
                        key={product.id}
                        className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30 hover:bg-white/8"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className={`rounded-xl bg-gradient-to-br ${accent} p-[1px]`}>
                          <div className="rounded-[11px] bg-[#060811] p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                                {categories.find((c) => c.id === product.category_id)?.name}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
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
                            <div className="mb-3 rounded-xl border border-white/10 bg-black/40 p-3">
                              <svg viewBox="0 0 240 160" className="h-24 w-full" xmlns="http://www.w3.org/2000/svg">
                                <rect x="22" y="24" width="196" height="112" rx="24" fill="#0d1324" stroke="rgba(255,255,255,0.16)" />
                                <rect x="48" y="46" width="144" height="68" rx="16" fill="none" stroke="#4ddcff" strokeWidth="4" />
                                <circle cx="88" cy="80" r="18" fill="url(#glow)" />
                                <circle cx="152" cy="80" r="18" fill="url(#glow)" />
                                <path d="M78 74c12-18 32-18 44 0" stroke="#ff3fa3" strokeWidth="4" strokeLinecap="round" />
                                <defs>
                                  <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#4ddcff" />
                                    <stop offset="100%" stopColor="#ff3fa3" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                            <h4 className="text-lg font-semibold text-white">{product.name}</h4>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{product.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <p className="text-xl font-semibold text-white">{formatCurrency(product.price_eur)}</p>
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ready for collection</p>
                              </div>
                              <button
                                type="button"
                                disabled={outOfStock}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  addToCart(product)
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ShoppingBag className="size-4" />
                                {outOfStock ? 'Sold out' : 'Add to Pre-Order'}
                              </button>
                            </div>
                            {quantity > 0 && (
                              <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    updateQuantity(product.id, -1)
                                  }}
                                  className="rounded-full border border-white/10 p-2 text-zinc-300"
                                >
                                  <Minus className="size-4" />
                                </button>
                                <span className="min-w-8 text-center text-sm font-semibold text-white">{quantity}</span>
                                <button
                                  type="button"
                                  disabled={quantity >= product.stock_qty}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    updateQuantity(product.id, 1)
                                  }}
                                  className="rounded-full border border-white/10 p-2 text-zinc-300 disabled:opacity-40"
                                >
                                  <Plus className="size-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#070b14]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Click & Collect Pre-Order</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">E-Liquids in stock</h2>
                </div>
                <div className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1.5 text-sm text-fuchsia-200">
                  {eliquidCartCount} item{eliquidCartCount === 1 ? '' : 's'} in pre-order
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

              {combinedCartCount > 0 ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">Your order</p>
                    <p className="text-sm text-zinc-300">{combinedCartCount} item{combinedCartCount === 1 ? '' : 's'}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-zinc-500">x{item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} className="rounded-full p-1 text-zinc-300">
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-5 text-center text-xs font-semibold text-white">{item.quantity}</span>
                            <button
                              type="button"
                              disabled={item.quantity >= item.stock_qty}
                              onClick={() => updateQuantity(item.id, 1)}
                              className="rounded-full p-1 text-zinc-300 disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="rounded-full border border-white/10 p-1.5 text-zinc-400 transition hover:text-rose-300"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <p className="text-sm font-semibold text-cyan-200">{formatCurrency(item.price_eur * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                    {eliquidCartLines.map((line) => (
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
                              onClick={() => setEliquidLineQty(line.variantId, line.qty - 1, line.variant.stock_quantity)}
                              className="rounded-full p-1 text-zinc-300"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-5 text-center text-xs font-semibold text-white">{line.qty}</span>
                            <button
                              type="button"
                              disabled={line.qty >= line.variant.stock_quantity}
                              onClick={() => setEliquidLineQty(line.variantId, line.qty + 1, line.variant.stock_quantity)}
                              className="rounded-full p-1 text-zinc-300 disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEliquidFromCart(line.variantId)}
                            className="rounded-full border border-white/10 p-1.5 text-zinc-400 transition hover:text-rose-300"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                          <p className="text-sm font-semibold text-cyan-200">{formatCurrency(line.variant.price * line.qty)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {nextTier ? (
                    <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-200">
                      Add {formatCurrency(nextTier.min_order_total - subtotal)} more to unlock {nextTier.discount_percent}% off
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm">
                    {discountPercent > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>Subtotal</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-300">
                          <span>Discount ({discountPercent}%)</span>
                          <span>-{formatCurrency(subtotal - total)}</span>
                        </div>
                      </>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Estimated total</span>
                      <span className="text-lg font-semibold text-white">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
                  Add a few items and the checkout panel will appear here.
                </div>
              )}

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
                    placeholder="Alex Murphy"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="phone">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white placeholder:text-zinc-500"
                    placeholder="085 805 1510"
                  />
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                  <input
                    checked={ageVerified}
                    onChange={(event) => setAgeVerified(event.target.checked)}
                    className="mt-0.5 size-4 rounded border-white/20 bg-transparent"
                    type="checkbox"
                  />
                  <span>I confirm I am 18+ and happy for the shop to hold this order for collection.</span>
                </label>

                {!user ? (
                  <p className="text-xs text-zinc-500">
                    Checking out as a guest.{' '}
                    <Link href="/account/signup" className="text-cyan-300 hover:text-cyan-200">
                      Create an account
                    </Link>{' '}
                    to save your details and unlock volume discounts automatically.
                  </p>
                ) : null}

                {error ? <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div> : null}

                <button
                  type="submit"
                  disabled={submitting || combinedCartCount === 0}
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    combinedCartCount === 0
                      ? 'cursor-not-allowed bg-white/5 text-zinc-500'
                      : submitting
                        ? 'cursor-not-allowed bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 opacity-60'
                        : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 hover:brightness-110'
                  }`}
                >
                  {combinedCartCount === 0 ? 'Add items to pre-order' : submitting ? 'Submitting…' : 'Submit Pre-Order for Collection'}
                  {combinedCartCount > 0 ? <ArrowRight className="size-4" /> : null}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#060811]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">
                <ShieldCheck className="size-4 text-cyan-400" />
                How your order works
              </div>

              {receipt ? (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <BadgeCheck className="size-5" />
                    <p className="font-semibold">Pre-order received</p>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-emerald-50">
                    <p>Reference: {receipt.reference}</p>
                    <p>For: {receipt.name}</p>
                    {receipt.discountPercent > 0 ? <p>Discount applied: {receipt.discountPercent}%</p> : null}
                    <p>Total: {formatCurrency(receipt.total)}</p>
                    <p>Your items are being held behind the counter and we&apos;ll call when they are ready.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-200">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Pick your items</p>
                        <p className="mt-1 text-sm text-zinc-400">Choose from the live in-store stock and add whatever you need to your pre-order.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-fuchsia-500/10 p-2 text-fuchsia-200">
                        <CalendarClock className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Submit your details</p>
                        <p className="mt-1 text-sm text-zinc-400">Share your name and phone number and confirm you are over 18 for collection.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-200">
                        <Store className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Collect from Maylor Street</p>
                        <p className="mt-1 text-sm text-zinc-400">The team holds your order behind the counter so pickup stays quick and straightforward.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur" onClick={() => setSelectedProduct(null)}>
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#060811] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  {categories.find((c) => c.id === selectedProduct.category_id)?.name}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedProduct.name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedProduct(null)} className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:text-white">
                <CircleX className="size-5" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm leading-7 text-zinc-300">{selectedProduct.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-400">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                  {stockLabel(selectedProduct.stock_qty).label}
                </span>
                {selectedProduct.age_restricted ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">18+ only</span>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-white">{formatCurrency(selectedProduct.price_eur)}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ready for collection</p>
              </div>
              <button
                type="button"
                disabled={selectedProduct.stock_qty <= 0}
                onClick={() => {
                  addToCart(selectedProduct)
                  setSelectedProduct(null)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingBag className="size-4" />
                Add to pre-order
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedEliquid ? (
        <EliquidDetailModal
          eliquid={selectedEliquid}
          onClose={() => setSelectedEliquid(null)}
          onAdd={(variantId, qty, maxStock) => {
            addEliquidToCart(variantId, qty, maxStock)
            setSelectedEliquid(null)
          }}
        />
      ) : null}

      {legalModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur" onClick={() => setLegalModal(null)}>
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#060811] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Store policy</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{legalModal === 'privacy' ? 'Privacy policy' : 'Terms of service'}</h3>
              </div>
              <button type="button" onClick={() => setLegalModal(null)} className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:text-white">
                <CircleX className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
              {legalModal === 'privacy' ? (
                <>
                  <p>{shop.name} collects your name and phone number only to manage a click-and-collect pre-order for the shop on Maylor Street.</p>
                  <p>We use this data solely to prepare your order, confirm collection, and contact you if there is a stock or timing issue. If you create an account, we also store it to speed up future checkouts.</p>
                  <p>If you would like your details removed, contact the shop directly on {shop.phone} and the team will update the record.</p>
                </>
              ) : (
                <>
                  <p>These terms apply to all click-and-collect orders placed through this storefront. Orders are subject to stock availability and collection times.</p>
                  <p>Customers must be aged 18 or over to purchase age-restricted products and to collect items from the premises.</p>
                  <p>{shop.name} reserves the right to refuse a collection if the order details are incomplete, the age requirement is not met, or the item is no longer available.</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <footer className="rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
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
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setLegalModal('privacy')} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/20 hover:text-white">
              Privacy Policy
            </button>
            <button type="button" onClick={() => setLegalModal('terms')} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-400/20 hover:text-white">
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </main>
  )
}
