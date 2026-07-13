'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthField, AuthSubmitButton, AuthError, AuthSuccess } from '@/components/auth-card'

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    setPending(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <AuthCard
      eyebrow="Shop Admin"
      title="Reset password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <Link href="/admin/login" className="font-medium text-cyan-300 hover:text-cyan-200">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <AuthSuccess message="If that email has an admin account, a reset link is on its way." />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error ? <AuthError message={error} /> : null}
          <AuthSubmitButton pending={pending}>
            Send reset link <ArrowRight className="size-4" />
          </AuthSubmitButton>
        </form>
      )}
    </AuthCard>
  )
}
