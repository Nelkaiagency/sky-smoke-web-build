'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleX,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trash2,
} from 'lucide-react'
import ContactForm from "@/components/ContactForm";
type Product = {
  id: string
  name: string
  category: 'Disposables' | 'Vapes & Mods' | 'Pods & Coils' | 'Snus & Pouches' | 'Skins & Papers' | 'Cigarettes' | 'Grinders & Access'
  price: number
  stock: string
  description: string
  details: string
  size: string
  accent: string
}

type ReceiptItem = Product & { quantity: number }

type Receipt = {
  reference: string
  name: string
  items: ReceiptItem[]
  total: number
}

const products: Product[] = [
  {
    id: 'pulse-600',
    name: 'Pulse 600 Disposable',
    category: 'Disposables',
    price: 12.5,
    stock: 'In Stock on Maylor St',
    description: 'Smooth draw, ready to go, ideal for quick top-ups.',
    details: 'Up to 600 puffs with dual mesh coil technology for enhanced flavor.',
    size: '600 puffs',
    accent: 'from-cyan-400 via-sky-500 to-fuchsia-500',
  },
  {
    id: 'lost-mary',
    name: 'Lost Mary 4in1',
    category: 'Disposables',
    price: 23.2,
    stock: 'In Stock on Maylor St',
    description: 'A dependable everyday disposable with strong flavour and a neat finish.',
    details: 'Compact and consistent, ideal when customers want an easy grab-and-go option.',
    size: '4-in-1 format',
    accent: 'from-fuchsia-500 via-purple-500 to-indigo-500',
  },
  {
    id: 'lost-mary-bm600',
    name: 'Lost Mary BM600',
    category: 'Disposables',
    price: 9.5,
    stock: 'In Stock on Maylor St',
    description: 'A practical pocket-friendly vape for everyday use.',
    details: 'Reliable single-use device with a simple draw activation system.',
    size: '600 puffs',
    accent: 'from-emerald-400 via-cyan-400 to-sky-500',
  },
  {
    id: 'xros-4',
    name: 'Vaporesso XROS 4 Kit',
    category: 'Vapes & Mods',
    price: 34.99,
    stock: 'In Stock on Maylor St',
    description: 'A polished refillable kit built for everyday reliability.',
    details: 'Pocket-friendly setup with fast pod swaps and smooth airflow.',
    size: 'Starter kit',
    accent: 'from-emerald-400 via-cyan-400 to-sky-500',
  },
  {
    id: 'geekvape-l200',
    name: 'Geekvape L200 Mod',
    category: 'Vapes & Mods',
    price: 64.99,
    stock: 'In Stock on Maylor St',
    description: 'A compact performance mod for regular users who want power and control.',
    details: 'High-performance chipset with quick, intuitive daily use.',
    size: 'Advanced mod',
    accent: 'from-orange-400 via-rose-500 to-fuchsia-500',
  },
  {
    id: 'xros-pods',
    name: 'Xros Replacement Pods 4-Pack',
    category: 'Pods & Coils',
    price: 14.0,
    stock: 'In Stock on Maylor St',
    description: 'Replacement pods for easy upkeep and quick swaps.',
    details: 'Designed for a clean, consistent draw with dependable coil life.',
    size: '4-pack',
    accent: 'from-violet-500 via-fuchsia-500 to-pink-500',
  },
  {
    id: 'pnp-coils',
    name: 'PnP Coil 5-Pack',
    category: 'Pods & Coils',
    price: 17.5,
    stock: 'In Stock on Maylor St',
    description: 'Keep the device fresh with a reliable coil pack.',
    details: 'A practical choice for regular pod users and quick turnarounds.',
    size: '5-pack',
    accent: 'from-slate-500 via-zinc-500 to-stone-600',
  },
  {
    id: 'velox-mint',
    name: 'Velox Mint 14mg',
    category: 'Snus & Pouches',
    price: 8.5,
    stock: 'In Stock on Maylor St',
    description: 'Slim format, intense mint profile, 14mg/g nicotine strength.',
    details: 'Slim format, intense mint profile, 14mg/g nicotine strength.',
    size: '14mg/g',
    accent: 'from-cyan-500 via-blue-500 to-slate-700',
  },
  {
    id: 'killa-cold',
    name: 'Killa Cold Mint',
    category: 'Snus & Pouches',
    price: 9.0,
    stock: 'In Stock on Maylor St',
    description: 'A crisp cold-mint pouch made for regular daytime use.',
    details: 'Balanced nicotine delivery with a cool, clean finish.',
    size: 'Regular pouch',
    accent: 'from-emerald-500 via-lime-400 to-cyan-500',
  },
  {
    id: 'siberia',
    name: 'Siberia Extremely Strong',
    category: 'Snus & Pouches',
    price: 11.0,
    stock: 'In Stock on Maylor St',
    description: 'A strong, compact pouch for customers who want a heavier hit.',
    details: 'High-impact delivery with a bold flavour profile.',
    size: 'Strong pouch',
    accent: 'from-fuchsia-500 via-pink-500 to-rose-500',
  },
  {
    id: 'raw-classic',
    name: 'RAW Classic King Size Slim',
    category: 'Skins & Papers',
    price: 2.5,
    stock: 'In Stock on Maylor St',
    description: 'Unbleached natural hemp fibers for an even, slow burn.',
    details: 'Unbleached natural hemp fibers for an even, slow burn.',
    size: 'King size slim',
    accent: 'from-amber-400 via-yellow-500 to-orange-500',
  },
  {
    id: 'ocb-premium',
    name: 'OCB Premium Slim + Tips',
    category: 'Skins & Papers',
    price: 3.0,
    stock: 'In Stock on Maylor St',
    description: 'Ultra-thin papers with included tips for a cleaner finish.',
    details: 'Ultra-thin papers with included tips.',
    size: 'Slim + tips',
    accent: 'from-fuchsia-500 via-pink-500 to-rose-500',
  },
  {
    id: 'elements-rice',
    name: 'Elements Rice Papers',
    category: 'Skins & Papers',
    price: 2.2,
    stock: 'In Stock on Maylor St',
    description: 'Slow burning rice paper for a controlled experience.',
    details: 'Slow burning rice paper.',
    size: 'Standard pack',
    accent: 'from-slate-500 via-zinc-500 to-stone-600',
  },
  {
    id: 'marlboro-gold',
    name: 'Marlboro Gold 20s',
    category: 'Cigarettes',
    price: 18.15,
    stock: 'In Stock on Maylor St',
    description: 'Standard factory-sealed 20-pack of premium king-size cigarettes.',
    details: 'Standard factory-sealed 20-pack of premium king-size cigarettes.',
    size: '20-pack',
    accent: 'from-slate-600 via-zinc-500 to-stone-500',
  },
  {
    id: 'john-player',
    name: 'John Player Blue 20s',
    category: 'Cigarettes',
    price: 18.25,
    stock: 'In Stock on Maylor St',
    description: 'A straightforward standard pack with a familiar profile.',
    details: 'A classic factory-sealed 20-pack for everyday purchase.',
    size: '20-pack',
    accent: 'from-red-500 via-orange-500 to-amber-400',
  },
  {
    id: 'amber-leaf',
    name: 'Amber Leaf 30g Pouch w/ Papers',
    category: 'Cigarettes',
    price: 27.6,
    stock: 'In Stock on Maylor St',
    description: 'A 30g roll-your-own pouch complete with rolling papers.',
    details: 'Includes rolling papers for a simple, convenient setup.',
    size: '30g pouch',
    accent: 'from-amber-500 via-orange-500 to-yellow-400',
  },
  {
    id: 'grinder-space',
    name: '4-Piece Space Aluminium Grinder',
    category: 'Grinders & Access',
    price: 24.99,
    stock: 'In Stock on Maylor St',
    description: 'A compact grinder made for reliable everyday use.',
    details: 'Smooth operation with a durable aluminium shell.',
    size: '4-piece',
    accent: 'from-cyan-500 via-sky-500 to-indigo-500',
  },
  {
    id: 'rolling-tray',
    name: 'Raw Rolling Tray',
    category: 'Grinders & Access',
    price: 12.0,
    stock: 'In Stock on Maylor St',
    description: 'A practical tray for keeping papers and accessories organised.',
    details: 'Simple, clean and useful for daily use at home or on the go.',
    size: 'Standard tray',
    accent: 'from-amber-400 via-orange-500 to-rose-500',
  },
]

const categories = ['Disposables', 'Vapes & Mods', 'Pods & Coils', 'Snus & Pouches', 'Skins & Papers', 'Cigarettes', 'Grinders & Access'] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export default function Page() {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [ageVerified, setAgeVerified] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Disposables')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  const isOpen = now.getHours() >= 10 && now.getHours() < 23
  const hoursLabel = isOpen ? 'Open Now — Closes 11 PM' : 'Closed Now — Reopens at 10 AM'

  const cartItems = useMemo(() => {
    return products.filter((product) => cart[product.id]).map((product) => ({ ...product, quantity: cart[product.id] }))
  }, [cart])

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const cartCount = useMemo(() => Object.values(cart).reduce((sum, count) => sum + count, 0), [cart])
  const visibleProducts = useMemo(() => {
    return products.filter((product) => product.category === selectedCategory)
  }, [selectedCategory])

  const addToCart = (product: Product) => {
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

    if (cartCount === 0) {
      setError('Add at least one item before submitting your pre-order.')
      return
    }

    setError('')

    const payload = {
      name: name.trim(),
      phone,
      age_verified: ageVerified,
      items: cartItems.map((item) => `${item.quantity} x ${item.name} (${formatCurrency(item.price)})`).join(' | '),
      total: formatCurrency(total),
      _subject: `Sky Smoke 1 Pre-Order from ${name.trim()}`,
    }

    try {
      await fetch('https://formspree.io/f/mkoldpve', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setReceipt({
        reference: `SKY-${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
        name: name.trim(),
        items: cartItems.map((item) => ({ ...item, quantity: item.quantity })),
        total,
      })
      setCart({})
      setName('')
      setPhone('')
      setAgeVerified(false)
    } catch {
      setError('Your order could not be sent right now. Please call the shop directly on 085 805 1510.')
    }
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
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sky Smoke 1
              </h1>
              <p className="mt-3 text-lg text-zinc-300">
                Fast collection, dependable stock, and a no-fuss pre-order flow for the shop on Maylor Street.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-zinc-300">
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-fuchsia-400" />
                  47 Maylor St, Centre, Cork, T12 AH70
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="size-4 text-cyan-400" />
                  085 805 1510
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                {hoursLabel}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
                <Star className="size-4 fill-fuchsia-400 text-fuchsia-400" />
                4.7 ★★★★★ (28 Reviews)
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-[#070b14]/90 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">
                    Click & Collect Pre-Order
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">What’s in stock right now</h2>
                </div>
                <div className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3 py-1.5 text-sm text-fuchsia-200">
                  {cartCount} item{cartCount === 1 ? '' : 's'} in pre-order
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = selectedCategory === category
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${isActive ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/5 text-zinc-400 hover:border-cyan-400/20 hover:text-zinc-200'}`}
                    >
                      {category === 'Skins & Papers' ? 'Skins & Papers' : category}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 space-y-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="size-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{selectedCategory}</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleProducts.map((product) => {
                    const quantity = cart[product.id] ?? 0
                    return (
                      <article
                        key={product.id}
                        className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30 hover:bg-white/8"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className={`rounded-xl bg-gradient-to-br ${product.accent} p-[1px]`}>
                          <div className="rounded-[11px] bg-[#060811] p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                                {product.category}
                              </span>
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium text-cyan-200">
                                {product.stock}
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
                                <p className="text-xl font-semibold text-white">{formatCurrency(product.price)}</p>
                                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ready for collection</p>
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  addToCart(product)
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
                              >
                                <ShoppingBag className="size-4" />
                                Add to Pre-Order
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
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    updateQuantity(product.id, 1)
                                  }}
                                  className="rounded-full border border-white/10 p-2 text-zinc-300"
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

              {cartItems.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">Your order</p>
                    <p className="text-sm text-zinc-300">{cartCount} item{cartCount === 1 ? '' : 's'}</p>
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
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="rounded-full p-1 text-zinc-300"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-5 text-center text-xs font-semibold text-white">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="rounded-full p-1 text-zinc-300"
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
                          <p className="text-sm font-semibold text-cyan-200">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                    <span className="text-zinc-400">Estimated total</span>
                    <span className="text-lg font-semibold text-white">{formatCurrency(total)}</span>
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

                {error ? (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
                ) : null}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                >
                  Submit Pre-Order for Collection
                  <ArrowRight className="size-4" />
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
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">{selectedProduct.category}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{selectedProduct.name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedProduct(null)} className="rounded-full border border-white/10 p-2 text-zinc-300 transition hover:text-white">
                <CircleX className="size-5" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm leading-7 text-zinc-300">{selectedProduct.details}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Size: {selectedProduct.size}</span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">Stock: {selectedProduct.stock}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-white">{formatCurrency(selectedProduct.price)}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ready for collection</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  addToCart(selectedProduct)
                  setSelectedProduct(null)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
              >
                <ShoppingBag className="size-4" />
                Add to pre-order
              </button>
            </div>
          </div>
        </div>
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
                  <p>Sky Smoke 1 collects your name and phone number only to manage a click-and-collect pre-order for the shop on Maylor Street.</p>
                  <p>We use this data solely to prepare your order, confirm collection, and contact you if there is a stock or timing issue.</p>
                  <p>If you would like your details removed, contact the shop directly on 085 805 1510 and the team will update the record.</p>
                </>
              ) : (
                <>
                  <p>These terms apply to all click-and-collect orders placed through this storefront. Orders are subject to stock availability and collection times.</p>
                  <p>Customers must be aged 18 or over to purchase age-restricted products and to collect items from the premises.</p>
                  <p>Sky Smoke 1 reserves the right to refuse a collection if the order details are incomplete, the age requirement is not met, or the item is no longer available.</p>
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
              <p className="flex items-center gap-2"><MapPin className="size-4 text-fuchsia-400" />47 Maylor St, Cork, T12 AH70</p>
              <p className="flex items-center gap-2"><Phone className="size-4 text-cyan-400" />085 805 1510</p>
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
    </main>
  )
}
