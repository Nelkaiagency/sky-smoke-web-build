'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthField, AuthSubmitButton, AuthError } from '@/components/auth-card'

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setPending(false)
    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <AuthCard eyebrow="Shop Admin" title="Set a new password">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error ? <AuthError message={error} /> : null}
        <AuthSubmitButton pending={pending}>
          Update password <ArrowRight className="size-4" />
        </AuthSubmitButton>
      </form>
    </AuthCard>
  )
}
