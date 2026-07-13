import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'
import { StockTable } from '@/components/admin/stock-table'

export default async function AdminStockPage() {
  const supabase = await createClient()

  const [products, categories] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price_eur, stock_qty, active, category_id, age_restricted')
      .eq('shop_id', SHOP_ID)
      .order('name', { ascending: true }),
    supabase.from('product_categories').select('id, name').eq('shop_id', SHOP_ID).order('sort_order', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-400">Inventory</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Stock</h1>
      </div>
      <Suspense>
        <StockTable products={products.data ?? []} categories={categories.data ?? []} />
      </Suspense>
    </div>
  )
}
