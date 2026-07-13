'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ensureCustomerProfile } from '@/lib/ensure-customer-profile'
import { AuthCard, AuthField, AuthSubmitButton, AuthError, AuthSuccess } from '@/components/auth-card'

export default function CustomerSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Could not create account.')
      setPending(false)
      return
    }

    if (!data.session) {
      // email confirmation is required — profile row gets created on first login
      setNeedsConfirmation(true)
      setPending(false)
      return
    }

    await ensureCustomerProfile(supabase, data.user)

    setPending(false)
    router.push('/')
    router.refresh()
  }

  return (
    <AuthCard
      eyebrow="My Account"
      title="Create an account"
      subtitle="Optional — you can always checkout as a guest instead."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/account/login" className="font-medium text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </>
      }
    >
      {needsConfirmation ? (
        <AuthSuccess message="Check your email to confirm your account, then sign in." />
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AuthField
            id="fullName"
            label="Name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <AuthField
            id="phone"
            label="Phone number"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
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
          {error ? <AuthError message={error} /> : null}
          <AuthSubmitButton pending={pending}>
            Create account <ArrowRight className="size-4" />
          </AuthSubmitButton>
        </form>
      )}
    </AuthCard>
  )
}
