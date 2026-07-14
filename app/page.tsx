import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { Storefront } from '@/components/storefront'

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [productsRes, categoriesRes, discountTiersRes, shopRes, profileRes, eliquidsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, price_eur, stock_qty, category_id, age_restricted')
      .eq('shop_id', SHOP_ID)
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase.from('product_categories').select('id, name, sort_order').eq('shop_id', SHOP_ID).order('sort_order', { ascending: true }),
    supabase.from('discount_tiers').select('min_order_total, discount_percent, active').eq('shop_id', SHOP_ID).eq('active', true),
    supabase.from('shops').select('name, address, phone').eq('id', SHOP_ID).single(),
    user
      ? supabase.from('customer_profiles').select('full_name, phone').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('eliquids')
      .select('id, flavor_name, brand, description, image_url, eliquid_variants(id, bottle_size, nicotine_strength, price, stock_quantity, sku)')
      .eq('shop_id', SHOP_ID)
      .order('flavor_name', { ascending: true }),
  ])

  return (
    <Storefront
      products={productsRes.data ?? []}
      categories={categoriesRes.data ?? []}
      discountTiers={discountTiersRes.data ?? []}
      shop={shopRes.data ?? { name: 'Sky Smoke 1', address: '47 Maylor St, Centre, Cork, T12 AH70', phone: '085 805 1510' }}
      user={user ? { id: user.id, email: user.email ?? '' } : null}
      customerProfile={profileRes.data ?? null}
      eliquids={eliquidsRes.data ?? []}
    />
  )
}
