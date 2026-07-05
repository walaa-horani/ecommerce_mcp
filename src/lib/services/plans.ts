import type { SupabaseClient } from '@supabase/supabase-js'

// The single source of truth for plan gating (SKILLS.md §14). No other file
// re-implements these limits — everything calls checkPlanLimit / assertPlanLimit.
//
// free = 1 warehouse, 3 products, no suppliers / purchase orders / MCP.
// pro  = unlimited, all features.

export type PlanFeature =
  | 'add_product'
  | 'add_warehouse'
  | 'suppliers'
  | 'purchase_orders'
  | 'mcp_access'

export interface PlanCheck {
  allowed: boolean
  plan: 'free' | 'pro'
  reason?: string
  limit?: number
  used?: number
}

export const FREE_LIMITS = { products: 3, warehouses: 1 } as const

const UPGRADE = 'Upgrade to Pro to unlock this.'

async function countRows(
  supabase: SupabaseClient,
  table: 'products' | 'warehouses',
  orgId: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
  if (error) throw error
  return count ?? 0
}

/**
 * Returns whether `orgId` may use `feature` under its current plan. Pro passes
 * everything; free enforces the counts/feature flags above. Reads the plan from
 * the DB each call so it always reflects the latest admin-set tier.
 */
export async function checkPlanLimit(
  supabase: SupabaseClient,
  orgId: string,
  feature: PlanFeature
): Promise<PlanCheck> {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()
  if (error) throw error

  const plan: 'free' | 'pro' = org.plan === 'pro' ? 'pro' : 'free'
  if (plan === 'pro') return { allowed: true, plan }

  switch (feature) {
    case 'add_product': {
      const used = await countRows(supabase, 'products', orgId)
      return used < FREE_LIMITS.products
        ? { allowed: true, plan, limit: FREE_LIMITS.products, used }
        : {
            allowed: false,
            plan,
            limit: FREE_LIMITS.products,
            used,
            reason: `Free plan is limited to ${FREE_LIMITS.products} products. ${UPGRADE}`,
          }
    }
    case 'add_warehouse': {
      const used = await countRows(supabase, 'warehouses', orgId)
      return used < FREE_LIMITS.warehouses
        ? { allowed: true, plan, limit: FREE_LIMITS.warehouses, used }
        : {
            allowed: false,
            plan,
            limit: FREE_LIMITS.warehouses,
            used,
            reason: `Free plan is limited to ${FREE_LIMITS.warehouses} warehouse. ${UPGRADE}`,
          }
    }
    case 'suppliers':
    case 'purchase_orders':
      return { allowed: false, plan, reason: `Purchase orders are a Pro feature. ${UPGRADE}` }
    case 'mcp_access':
      return { allowed: false, plan, reason: `MCP access requires the Pro plan. ${UPGRADE}` }
    default:
      return { allowed: true, plan }
  }
}

/** Throws with the plan reason if the feature is not allowed. */
export async function assertPlanLimit(
  supabase: SupabaseClient,
  orgId: string,
  feature: PlanFeature
): Promise<void> {
  const result = await checkPlanLimit(supabase, orgId, feature)
  if (!result.allowed) throw new Error(result.reason ?? 'Plan limit reached.')
}
