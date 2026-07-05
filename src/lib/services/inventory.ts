import type { SupabaseClient } from '@supabase/supabase-js'
import { logAction } from './audit'

export interface LowStockProduct {
  productId: string
  name: string
  sku: string
  quantity: number
}

interface JoinedProduct {
  id: string
  name: string
  sku: string
}

interface LowStockRow {
  quantity: number
  products: JoinedProduct | JoinedProduct[] | null
}

interface StockEntry {
  quantity: number
  warehouse_id: string
}

interface ProductRow {
  id: string
  name?: string
  price?: number
  is_published?: boolean
  product_stock?: StockEntry[]
  [key: string]: unknown
}

interface FulfillmentStockRow {
  product_id: string
  warehouse_id: string
  quantity: number
  products: { name: string; reorder_threshold: number } | { name: string; reorder_threshold: number }[] | null
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

  return data.map((row: LowStockRow) => {
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

export interface ProductFilters {
  category?: string;
  warehouse_id?: string;
  status?: boolean; // true = published, false = draft
  no_movement_since_days?: number;
  min_quantity?: number;
  max_quantity?: number;
}

export async function getProductsFiltered(
  supabase: SupabaseClient,
  orgId: string,
  filters: ProductFilters
) {
  let query = supabase.from('products').select('*, product_stock(quantity, warehouse_id)').eq('org_id', orgId);

  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.status !== undefined) {
    query = query.eq('is_published', filters.status);
  }

  const { data: products, error } = await query;
  if (error) throw error;

  let result = (products as ProductRow[]).map((p) => {
    let totalStock = 0;
    if (p.product_stock && Array.isArray(p.product_stock)) {
      totalStock = p.product_stock.reduce((sum: number, s: StockEntry) => sum + (s.quantity || 0), 0);
    }
    return { ...p, totalStock };
  });

  // Filter in memory for stock and warehouse if needed
  if (filters.warehouse_id) {
    result = result.filter((p) => p.product_stock?.some((s) => s.warehouse_id === filters.warehouse_id));
  }

  if (typeof filters.min_quantity === 'number') {
    result = result.filter((p) => p.totalStock >= filters.min_quantity!);
  }

  if (typeof filters.max_quantity === 'number') {
    result = result.filter((p) => p.totalStock <= filters.max_quantity!);
  }

  if (filters.no_movement_since_days) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - filters.no_movement_since_days);
    
    // Fetch recent movements for this org
    const { data: recentMovements, error: movErr } = await supabase
      .from('stock_movements')
      .select('product_id')
      .eq('org_id', orgId)
      .gte('created_at', dateLimit.toISOString());
      
    if (movErr) throw movErr;
    
    const activeProductIds = new Set(recentMovements.map((m: { product_id: string }) => m.product_id));
    result = result.filter((p) => !activeProductIds.has(p.id));
  }

  return result;
}

export interface FulfillmentItem {
  product_id: string;
  warehouse_id: string;
  quantity: number;
}

export async function simulateFulfillment(
  supabase: SupabaseClient,
  orgId: string,
  items: FulfillmentItem[]
) {
  if (items.length === 0) return [];

  // fetch stock
  const { data: stock, error } = await supabase
    .from('product_stock')
    .select('*, products(name, reorder_threshold)')
    .eq('org_id', orgId)
    .in('product_id', items.map(i => i.product_id));
    
  if (error) throw error;
  
  const report = items.map(item => {
    const current = stock.find((s: FulfillmentStockRow) => s.product_id === item.product_id && s.warehouse_id === item.warehouse_id);
    const currentQty = current?.quantity || 0;
    const product = Array.isArray(current?.products) ? current?.products[0] : current?.products;
    const threshold = product?.reorder_threshold || 10;
    
    const newQty = currentQty - item.quantity;
    
    return {
      product_id: item.product_id,
      name: product?.name || 'Unknown',
      warehouse_id: item.warehouse_id,
      requested_quantity: item.quantity,
      current_quantity: currentQty,
      projected_quantity: newQty,
      is_negative: newQty < 0,
      is_below_threshold: newQty >= 0 && newQty <= threshold
    };
  });
  
  return report;
}

export async function bulkUpdateProducts(
  supabase: SupabaseClient,
  orgId: string,
  filters: ProductFilters,
  updates: Record<string, unknown>,
  confirm: boolean = false,
  actor?: string
) {
  const targetProducts = await getProductsFiltered(supabase, orgId, filters);
  
  if (!confirm) {
    return {
      preview: true,
      message: `Found ${targetProducts.length} products matching the criteria. Pass confirm: true to apply updates.`,
      targetProducts: targetProducts.map((p) => ({ id: p.id, name: p.name, current_price: p.price, current_published: p.is_published })),
      proposedUpdates: updates
    };
  }

  // Apply updates
  const targetIds = targetProducts.map((p) => p.id);
  if (targetIds.length === 0) {
    return { message: "No products matched the criteria." };
  }
  
  const { error } = await supabase
    .from('products')
    .update(updates)
    .in('id', targetIds)
    .eq('org_id', orgId);
    
  if (error) throw error;
  
  if (actor) {
    await logAction(supabase, orgId, actor, 'bulk_update_products', 'products', targetIds, { filters, updates });
  }
  
  return {
    success: true,
    message: `Successfully updated ${targetIds.length} products.`,
    updatedIds: targetIds
  };
}
