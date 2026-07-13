/** Each deployment serves exactly one shop, identified by this env var. Reused per-client by pointing it at a different shop_id. */
export const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID!

if (!SHOP_ID) {
  throw new Error('NEXT_PUBLIC_SHOP_ID is not set')
}
