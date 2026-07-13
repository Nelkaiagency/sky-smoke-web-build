import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { SHOP_ID } from '@/lib/shop'

/** Creates the customer_profiles row on first login if the signup email-confirmation step skipped it. Never overwrites an existing row. */
export async function ensureCustomerProfile(supabase: SupabaseClient<Database>, user: User) {
  await supabase.from('customer_profiles').upsert(
    {
      id: user.id,
      shop_id: SHOP_ID,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      phone: (user.user_metadata?.phone as string | undefined) ?? null,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
}
