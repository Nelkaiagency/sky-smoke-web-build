import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, shop_id')
    .eq('id', user.id)
    .eq('shop_id', SHOP_ID)
    .maybeSingle()

  if (!adminUser) {
    redirect('/admin/login?error=not_admin')
  }

  const { data: shop } = await supabase.from('shops').select('name').eq('id', SHOP_ID).single()

  return (
    <div className="min-h-screen bg-[#04070d] text-zinc-100">
      <AdminNav shopName={shop?.name ?? 'Admin'} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
