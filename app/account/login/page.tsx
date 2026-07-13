'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ensureCustomerProfile } from '@/lib/ensure-customer-profile'
import { AuthCard, AuthField, AuthSubmitButton, AuthError } from '@/components/auth-card'

export default function CustomerLoginPage() {
  return (
    <Suspense>
      <CustomerLoginForm />
    </Suspense>
  )
}

function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !data.user) {
      setError('Incorrect email or password.')
      setPending(false)
      return
    }

    await ensureCustomerProfile(supabase, data.user)

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <AuthCard
      eyebrow="My Account"
      title="Sign in"
      subtitle="Faster checkout and volume discounts on bigger orders."
      footer={
        <>
          New here?{' '}
          <Link href="/account/signup" className="font-medium text-cyan-300 hover:text-cyan-200">
            Create an account
          </Link>{' '}
          or{' '}
          <Link href="/" className="font-medium text-cyan-300 hover:text-cyan-200">
            checkout as guest
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="text-right">
          <Link href="/account/forgot-password" className="text-sm text-cyan-300 hover:text-cyan-200">
            Forgot password?
          </Link>
        </div>
        {error ? <AuthError message={error} /> : null}
        <AuthSubmitButton pending={pending}>
          Sign in <ArrowRight className="size-4" />
        </AuthSubmitButton>
      </form>
    </AuthCard>
  )
}
