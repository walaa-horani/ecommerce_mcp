import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Checks if a vendor organization has access to a specific feature based on their plan.
 * Used for feature gating (e.g., 'mcp_access' requires the 'pro' plan).
 */
export async function checkPlanLimit(
  supabase: SupabaseClient,
  orgId: string,
  feature: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single()

  if (error || !data) {
    return false
  }

  // MCP access requires 'pro' plan per SKILLS.md rule 10
  if (feature === 'mcp_access') {
    return data.plan === 'pro'
  }

  // Add other features and their plan requirements here as needed.
  return false
}
