import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminVendor {
  id: string
  name: string
  plan: string // 'Free' | 'Pro' (capitalized for display)
  isActive: boolean
  productCount: number
  orderCount: number
}

export interface PlatformSettings {
  globalFee: number
  freePlanCost: number
  proPlanCost: number
  platformStatus: boolean
  globalBanner: string
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/** All vendors with aggregate counts, via the admin-guarded DB function. */
export async function getAdminVendors(supabase: SupabaseClient): Promise<AdminVendor[]> {
  const { data, error } = await supabase.rpc('get_admin_vendor_overview')
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((v: any) => ({
    id: v.id,
    name: v.name,
    plan: cap(v.plan),
    isActive: v.is_active,
    productCount: Number(v.product_count),
    orderCount: Number(v.order_count),
  }))
}

export async function getPlatformSettings(supabase: SupabaseClient): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('global_fee, free_plan_cost, pro_plan_cost, platform_status, global_banner')
    .eq('id', 1)
    .single()
  if (error) throw error
  return {
    globalFee: Number(data.global_fee),
    freePlanCost: Number(data.free_plan_cost),
    proPlanCost: Number(data.pro_plan_cost),
    platformStatus: data.platform_status,
    globalBanner: data.global_banner,
  }
}

export async function savePlatformSettings(
  supabase: SupabaseClient,
  settings: PlatformSettings
): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .update({
      global_fee: settings.globalFee,
      free_plan_cost: settings.freePlanCost,
      pro_plan_cost: settings.proPlanCost,
      platform_status: settings.platformStatus,
      global_banner: settings.globalBanner,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  if (error) throw error
}

/** Change a vendor's plan. RLS: only platform admins may update organizations (§6). */
export async function setVendorPlan(
  supabase: SupabaseClient,
  orgId: string,
  plan: 'free' | 'pro'
): Promise<void> {
  const { error } = await supabase.from('organizations').update({ plan }).eq('id', orgId)
  if (error) throw error
}

export async function setVendorActive(
  supabase: SupabaseClient,
  orgId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase.from('organizations').update({ is_active: isActive }).eq('id', orgId)
  if (error) throw error
}
