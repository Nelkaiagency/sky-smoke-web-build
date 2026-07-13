'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthField, AuthSubmitButton, AuthError } from '@/components/auth-card'
import { SHOP_ID } from '@/lib/shop'

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(
    searchParams.get('error') === 'not_admin' ? 'That account is not an admin for this shop.' : '',
  )

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

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', data.user.id)
      .eq('shop_id', SHOP_ID)
      .maybeSingle()

    if (!adminUser) {
      await supabase.auth.signOut()
      setError('That account is not an admin for this shop.')
      setPending(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <AuthCard
      eyebrow="Shop Admin"
      title="Sign in"
      subtitle="Manage stock, orders, and discounts."
      footer={
        <>
          No admin account?{' '}
          <Link href="/admin/signup" className="font-medium text-cyan-300 hover:text-cyan-200">
            Sign up with an invite code
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
          <Link href="/admin/forgot-password" className="text-sm text-cyan-300 hover:text-cyan-200">
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
