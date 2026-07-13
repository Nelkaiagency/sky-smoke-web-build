import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ID } from '@/lib/shop'

type OrderItem = { name: string; price_eur: number; quantity: number }

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('orders')
    .select('*')
    .eq('shop_id', SHOP_ID)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: orders, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = (orders ?? []).map((order) => {
    const items = (order.items as unknown as OrderItem[]) ?? []
    return {
      'Order ID': order.id,
      'Placed At': order.created_at,
      Customer: order.customer_name,
      Phone: order.customer_phone,
      Status: order.status,
      Source: order.source,
      Items: items.map((i) => `${i.quantity} x ${i.name}`).join(', '),
      'Subtotal (EUR)': order.subtotal_before_discount ?? order.total_eur,
      'Discount %': order.discount_applied_percent ?? 0,
      'Total (EUR)': order.total_eur,
      'Collected At': order.collected_at ?? '',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="orders${status ? `-${status}` : ''}.xlsx"`,
    },
  })
}
