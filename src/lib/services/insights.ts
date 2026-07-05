import type { SupabaseClient } from '@supabase/supabase-js'

export async function getInventoryInsights(supabase: SupabaseClient, orgId: string) {
  // Query product stock
  const { data: stockData, error: stockErr } = await supabase
    .from('product_stock')
    .select('*, products(id, name, reorder_threshold)')
    .eq('org_id', orgId);
    
  if (stockErr) throw stockErr;
  
  // Aggregate total stock by product
  const stockByProduct: Record<string, { totalQuantity: number, name: string, threshold: number }> = {};
  for (const s of stockData) {
    const pId = s.product_id;
    if (!stockByProduct[pId]) {
      const product = Array.isArray(s.products) ? s.products[0] : s.products;
      stockByProduct[pId] = {
        totalQuantity: 0,
        name: product?.name || 'Unknown',
        threshold: product?.reorder_threshold || 10
      };
    }
    stockByProduct[pId].totalQuantity += (s.quantity || 0);
  }

  // Query stock movements (last 30 days, type = 'out')
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 30);
  
  const { data: movements, error: movErr } = await supabase
    .from('stock_movements')
    .select('product_id, quantity')
    .eq('org_id', orgId)
    .eq('type', 'out')
    .gte('created_at', dateLimit.toISOString());
    
  if (movErr) throw movErr;
  
  const salesByProduct: Record<string, number> = {};
  for (const m of movements) {
    salesByProduct[m.product_id] = (salesByProduct[m.product_id] || 0) + (m.quantity || 0);
  }
  
  const insights = Object.entries(stockByProduct).map(([pId, info]) => {
    const totalSales30Days = salesByProduct[pId] || 0;
    const dailyVelocity = totalSales30Days / 30;
    
    let daysUntilStockout = null;
    if (dailyVelocity > 0) {
      daysUntilStockout = Math.floor(info.totalQuantity / dailyVelocity);
    }
    
    // Suggest reorder quantity (e.g., 30 days of stock + threshold)
    const suggestedReorder = Math.ceil(dailyVelocity * 30 + info.threshold - info.totalQuantity);
    
    return {
      product_id: pId,
      name: info.name,
      current_stock: info.totalQuantity,
      sales_last_30_days: totalSales30Days,
      daily_sales_velocity: Number(dailyVelocity.toFixed(2)),
      estimated_days_until_stockout: daysUntilStockout,
      suggested_reorder_quantity: Math.max(0, suggestedReorder)
    };
  });
  
  return insights;
}
