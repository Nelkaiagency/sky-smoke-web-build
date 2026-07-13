'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STATUSES = ['pending', 'confirmed', 'collected', 'cancelled'] as const

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string | null }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const handleChange = async (value: string) => {
    setPending(true)
    const supabase = createClient()
    const update: { status: string; collected_at?: string } = { status: value }
    if (value === 'collected') update.collected_at = new Date().toISOString()
    await supabase.from('orders').update(update).eq('id', orderId)
    setPending(false)
    router.refresh()
  }

  return (
    <select
      value={status ?? 'pending'}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-sm font-medium capitalize text-white disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}
