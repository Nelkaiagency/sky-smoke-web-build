'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, LayoutDashboard, LogOut, Package, Percent, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/stock', label: 'Stock', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminNav({ shopName }: { shopName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{shopName}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Admin</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-rose-400/30 hover:text-rose-200"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
        {TABS.map((tab) => {
          const isActive = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:border-cyan-400/20 hover:text-zinc-200'
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
