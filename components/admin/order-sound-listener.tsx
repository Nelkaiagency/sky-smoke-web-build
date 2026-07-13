'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SHOP_ID } from '@/lib/shop'
import { isSoundMuted, onSoundMuteChange, playChime } from '@/lib/admin-sound'
import { Toast, useToast } from '@/components/toast'

/** Invisible: subscribes to new orders for this shop via Supabase Realtime, chimes + refreshes the list. */
export function OrderSoundListener() {
  const router = useRouter()
  const mutedRef = useRef(isSoundMuted())
  const { message, show, dismiss } = useToast()

  useEffect(() => {
    mutedRef.current = isSoundMuted()
    return onSoundMuteChange((muted) => {
      mutedRef.current = muted
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`orders-inserts-${SHOP_ID}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `shop_id=eq.${SHOP_ID}` },
        (payload) => {
          if (!mutedRef.current) playChime()
          const name = (payload.new as { customer_name?: string }).customer_name
          show(name ? `New order from ${name}` : 'New order received')
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Toast message={message} onDismiss={dismiss} />
}
