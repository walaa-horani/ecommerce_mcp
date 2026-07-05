import type { SupabaseClient } from '@supabase/supabase-js'

export interface LowStockProduct {
  productId: string
  name: string
  sku: string
  quantity: number
}

/**
 * Retrieves products with stock levels at or below a given threshold.
 * Scoped to the caller's organization.
 */
export async function getLowStockProducts(
  supabase: SupabaseClient,
  orgId: string,
  threshold: number = 10
): Promise<LowStockProduct[]> {
  const { data, error } = await supabase
    .from('product_stock')
    .select('quantity, products(id, name, sku)')
    .eq('org_id', orgId)
    .lte('quantity', threshold)

  if (error) {
    throw error
  }

  return data.map((row: any) => {
    // Supabase join on many-to-one returns an object or an array depending on the relation.
    // Assuming product_stock belongs to one product:
    const product = Array.isArray(row.products) ? row.products[0] : row.products
    return {
      productId: product?.id ?? 'unknown',
      name: product?.name ?? 'Unknown Product',
      sku: product?.sku ?? 'unknown',
      quantity: row.quantity,
    }
  })
}
