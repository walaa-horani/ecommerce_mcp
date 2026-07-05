import type { SupabaseClient } from '@supabase/supabase-js'

export interface OrderLine {
  productName: string
  quantity: number
  unitPrice: number
}

export interface CustomerOrder {
  id: string
  vendorName: string
  createdAt: string
  status: string
  total: number
  lines: OrderLine[]
}

type JoinedOrg = { name: string | null } | { name: string | null }[] | null
type JoinedProduct = { name: string | null } | { name: string | null }[] | null
type JoinedOrderItem = {
  quantity: number
  unit_price: number | string
  products: JoinedProduct
}
type JoinedOrder = {
  id: string
  status: string
  total_amount: number | string
  created_at: string
  organizations: JoinedOrg
  order_items: JoinedOrderItem[]
}

function first<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null
}

/**
 * The signed-in customer's orders, newest first, with vendor name and line
 * items. RLS (`orders.customer_id = auth.uid()`) restricts this to their own.
 */
export async function getCustomerOrders(
  supabase: SupabaseClient,
  customerId: string
): Promise<CustomerOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, created_at, organizations(name), order_items(quantity, unit_price, products(name))'
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return ((data ?? []) as JoinedOrder[]).map((o) => ({
    id: o.id,
    vendorName: first(o.organizations)?.name ?? 'Unknown vendor',
    createdAt: o.created_at,
    status: o.status,
    total: Number(o.total_amount),
    lines: (o.order_items ?? []).map((li) => ({
      productName: first(li.products)?.name ?? 'Removed product',
      quantity: li.quantity,
      unitPrice: Number(li.unit_price),
    })),
  }))
}
