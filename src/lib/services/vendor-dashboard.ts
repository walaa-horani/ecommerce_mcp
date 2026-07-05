import type { SupabaseClient } from '@supabase/supabase-js'

const LOW_STOCK_FALLBACK = 3

export interface VendorProduct {
  id: string
  sku: string
  name: string
  price: number
  stock: number
  lowStockThreshold: number
}
export interface VendorOrder {
  id: string
  customerName: string
  total: number
  status: string // capitalized for display
  items: string[]
}
export interface VendorWarehouse {
  id: string
  name: string
  location: string | null
  unitsOnHand: number
}
export interface VendorPurchaseOrder {
  id: string
  supplier: string
  amount: number
  date: string
  status: string
}
export interface VendorStore {
  id: string
  name: string
  plan: string // 'Free' | 'Pro'
  isActive: boolean
}
export interface VendorMetrics {
  totalSales: number
  ordersVolume: number
  lowStockCount: number
  activeProducts: number
}
export interface VendorDashboardData {
  store: VendorStore
  products: VendorProduct[]
  orders: VendorOrder[]
  warehouses: VendorWarehouse[]
  purchaseOrders: VendorPurchaseOrder[]
  metrics: VendorMetrics
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
function first<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null
}

/**
 * All dashboard data for one vendor org. Every query is org-scoped and further
 * enforced by RLS (`is_org_member`). Read-only.
 */
export async function getVendorDashboardData(
  supabase: SupabaseClient,
  orgId: string
): Promise<VendorDashboardData> {
  const [orgRes, productsRes, stockRes, ordersRes, warehousesRes, poRes] = await Promise.all([
    supabase.from('organizations').select('id, name, plan, is_active').eq('id', orgId).single(),
    supabase.from('products').select('id, sku, name, price, reorder_threshold').eq('org_id', orgId).order('created_at', { ascending: false }),
    supabase.from('product_stock').select('product_id, warehouse_id, quantity').eq('org_id', orgId),
    supabase
      .from('orders')
      .select('id, status, total_amount, created_at, customers(name, email), order_items(quantity, products(name))')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase.from('warehouses').select('id, name, location').eq('org_id', orgId).order('created_at', { ascending: false }),
    supabase
      .from('purchase_orders')
      .select('id, status, created_at, suppliers(name), purchase_order_items(quantity, unit_price)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
  ])

  if (orgRes.error) throw orgRes.error
  if (productsRes.error) throw productsRes.error
  if (stockRes.error) throw stockRes.error
  if (ordersRes.error) throw ordersRes.error
  if (warehousesRes.error) throw warehousesRes.error
  if (poRes.error) throw poRes.error

  // Aggregate stock per product and per warehouse.
  const stockByProduct = new Map<string, number>()
  const stockByWarehouse = new Map<string, number>()
  for (const row of stockRes.data ?? []) {
    stockByProduct.set(row.product_id, (stockByProduct.get(row.product_id) ?? 0) + row.quantity)
    stockByWarehouse.set(row.warehouse_id, (stockByWarehouse.get(row.warehouse_id) ?? 0) + row.quantity)
  }

  const products: VendorProduct[] = (productsRes.data ?? []).map((p) => {
    const threshold = p.reorder_threshold > 0 ? p.reorder_threshold : LOW_STOCK_FALLBACK
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      price: Number(p.price),
      stock: stockByProduct.get(p.id) ?? 0,
      lowStockThreshold: threshold,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: VendorOrder[] = (ordersRes.data ?? []).map((o: any) => {
    const customer = first(o.customers)
    return {
      id: o.id,
      customerName: customer?.name ?? customer?.email ?? 'Guest',
      total: Number(o.total_amount),
      status: cap(o.status),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (o.order_items ?? []).map((li: any) => `${first(li.products)?.name ?? 'Item'} (${li.quantity})`),
    }
  })

  const warehouses: VendorWarehouse[] = (warehousesRes.data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    location: w.location,
    unitsOnHand: stockByWarehouse.get(w.id) ?? 0,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchaseOrders: VendorPurchaseOrder[] = (poRes.data ?? []).map((po: any) => ({
    id: po.id,
    supplier: first(po.suppliers)?.name ?? '—',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    amount: (po.purchase_order_items ?? []).reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0),
    date: po.created_at,
    status: cap(po.status),
  }))

  const totalSales = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0)
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length

  return {
    store: {
      id: orgRes.data.id,
      name: orgRes.data.name,
      plan: cap(orgRes.data.plan),
      isActive: orgRes.data.is_active,
    },
    products,
    orders,
    warehouses,
    purchaseOrders,
    metrics: {
      totalSales: Number(totalSales.toFixed(2)),
      ordersVolume: orders.length,
      lowStockCount,
      activeProducts: products.length,
    },
  }
}
