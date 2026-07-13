'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthField, AuthSubmitButton, AuthError } from '@/components/auth-card'

export default function AdminSignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)

    const res = await fetch('/admin/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, inviteCode }),
    })
    const body = await res.json()

    if (!res.ok) {
      setError(body.error ?? 'Could not create account.')
      setPending(false)
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Account created — please sign in.')
      setPending(false)
      router.push('/admin/login')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <AuthCard
      eyebrow="Shop Admin"
      title="Create admin account"
      subtitle="Requires an invite code from Nelkai or the shop owner."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/admin/login" className="font-medium text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </>
      }
    >
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
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          id="inviteCode"
          label="Invite code"
          type="text"
          autoComplete="off"
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />
        {error ? <AuthError message={error} /> : null}
        <AuthSubmitButton pending={pending}>
          Create account <ArrowRight className="size-4" />
        </AuthSubmitButton>
      </form>
    </AuthCard>
  )
}
