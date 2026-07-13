import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { EliquidsPage } from '@/components/eliquids-page'

export default async function ELiquidsRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [eliquidsRes, shopRes, profileRes] = await Promise.all([
    supabase
      .from('eliquids')
      .select('id, flavor_name, brand, description, image_url, eliquid_variants(id, bottle_size, nicotine_strength, price, stock_quantity, sku)')
      .eq('shop_id', SHOP_ID)
      .order('flavor_name', { ascending: true }),
    supabase.from('shops').select('name, address, phone').eq('id', SHOP_ID).single(),
    user
      ? supabase.from('customer_profiles').select('full_name, phone').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <EliquidsPage
      eliquids={eliquidsRes.data ?? []}
      shop={shopRes.data ?? { name: 'Sky Smoke 1', address: '47 Maylor St, Centre, Cork, T12 AH70', phone: '085 805 1510' }}
      user={user ? { id: user.id, email: user.email ?? '' } : null}
      customerProfile={profileRes.data ?? null}
    />
  )
}
