'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, CircleAlert } from 'lucide-react'

export type ToastMessage = { text: string; tone?: 'success' | 'error' } | null

/** Fixed-position toast, bottom-center. Pass null to hide. Auto-clears via onDismiss after `duration`ms. */
export function Toast({ message, onDismiss, duration = 2500 }: { message: ToastMessage; onDismiss: () => void; duration?: number }) {
  useEffect(() => {
    if (!message) return
    const timeout = setTimeout(onDismiss, duration)
    return () => clearTimeout(timeout)
  }, [message, onDismiss, duration])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || !message) return null

  const isError = message.tone === 'error'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur ${
          isError
            ? 'border-rose-400/30 bg-rose-500/15 text-rose-100'
            : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
        }`}
      >
        {isError ? <CircleAlert className="size-4" /> : <BadgeCheck className="size-4" />}
        {message.text}
      </div>
    </div>
  )
}

/** Convenience hook for the common "show(text), auto-clear" pattern. */
export function useToast() {
  const [message, setMessage] = useState<ToastMessage>(null)
  const show = (text: string, tone: 'success' | 'error' = 'success') => setMessage({ text, tone })
  const dismiss = () => setMessage(null)
  return { message, show, dismiss }
}
