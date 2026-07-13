import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SHOP_ID } from '@/lib/shop'

export async function POST(request: Request) {
  const { email, password, inviteCode } = await request.json()

  if (!email || !password || !inviteCode) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
  }

  if (inviteCode !== process.env.ADMIN_INVITE_CODE) {
    return NextResponse.json({ error: 'Invalid invite code.' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Could not create account.' }, { status: 400 })
  }

  const { error: insertError } = await admin.from('admin_users').insert({
    id: created.user.id,
    shop_id: SHOP_ID,
    email,
    role: 'admin',
  })

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
