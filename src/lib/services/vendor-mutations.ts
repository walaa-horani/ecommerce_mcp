import type { SupabaseClient } from '@supabase/supabase-js'

/** Records stock via the transactional DB function (SKILLS.md §8). */
export async function recordStockMovement(
  supabase: SupabaseClient,
  productId: string,
  warehouseId: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('record_stock_movement', {
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_type: type,
    p_quantity: quantity,
    p_note: note ?? null,
  })
  if (error) throw error
}

/** Returns any warehouse for the org, creating a default one if none exist. */
export async function ensureDefaultWarehouse(
  supabase: SupabaseClient,
  orgId: string
): Promise<string> {
  const { data: existing, error } = await supabase
    .from('warehouses')
    .select('id')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (existing) return existing.id

  const { data, error: insertError } = await supabase
    .from('warehouses')
    .insert({ org_id: orgId, name: 'Main Warehouse', location: 'Default' })
    .select('id')
    .single()
  if (insertError) throw insertError
  return data.id
}

export interface NewProduct {
  name: string
  price: number
  description: string
  sku: string
  imageUrl: string
  initialStock: number
}

/**
 * Creates a published product for the org. Any initial stock is applied through
 * a stock movement into a warehouse (auto-created if the org has none), so
 * product_stock is only ever changed via the movement path (SKILLS.md §8).
 */
export async function createProduct(
  supabase: SupabaseClient,
  orgId: string,
  input: NewProduct
): Promise<string> {
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      org_id: orgId,
      name: input.name,
      price: input.price,
      description: input.description,
      sku: input.sku,
      image_url: input.imageUrl,
      is_published: true,
    })
    .select('id')
    .single()
  if (error) throw error

  if (input.initialStock > 0) {
    const warehouseId = await ensureDefaultWarehouse(supabase, orgId)
    await recordStockMovement(supabase, product.id, warehouseId, 'in', input.initialStock, 'Initial stock')
  }
  return product.id
}

export async function createWarehouse(
  supabase: SupabaseClient,
  orgId: string,
  name: string,
  location: string
): Promise<void> {
  const { error } = await supabase.from('warehouses').insert({ org_id: orgId, name, location })
  if (error) throw error
}

export async function updateOrderStatus(
  supabase: SupabaseClient,
  orgId: string,
  orderId: string,
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
): Promise<void> {
  // org filter + RLS (members update org orders) keep this within the vendor.
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('org_id', orgId)
  if (error) throw error
}

async function findOrCreateSupplier(
  supabase: SupabaseClient,
  orgId: string,
  name: string
): Promise<string> {
  const { data: existing, error } = await supabase
    .from('suppliers')
    .select('id')
    .eq('org_id', orgId)
    .eq('name', name)
    .maybeSingle()
  if (error) throw error
  if (existing) return existing.id

  const { data, error: insertError } = await supabase
    .from('suppliers')
    .insert({ org_id: orgId, name })
    .select('id')
    .single()
  if (insertError) throw insertError
  return data.id
}

/** Creates a draft purchase order for a supplier (found or created by name). */
export async function createPurchaseOrder(
  supabase: SupabaseClient,
  orgId: string,
  supplierName: string
): Promise<void> {
  const supplierId = await findOrCreateSupplier(supabase, orgId, supplierName)
  const { error } = await supabase
    .from('purchase_orders')
    .insert({ org_id: orgId, supplier_id: supplierId, status: 'draft' })
  if (error) throw error
}

/** Renames the store via the owner-guarded DB function (org UPDATE is admin-only). */
export async function updateStoreName(
  supabase: SupabaseClient,
  orgId: string,
  name: string
): Promise<void> {
  const { error } = await supabase.rpc('update_org_name', { p_org_id: orgId, p_name: name })
  if (error) throw error
}
