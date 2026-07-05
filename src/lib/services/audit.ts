import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAction(
  supabase: SupabaseClient,
  orgId: string,
  actor: string, // uuid of the user/system
  action: string,
  target_table: string,
  target_ids: string[],
  details: Record<string, unknown>
) {
  const { error } = await supabase.from('audit_log').insert({
    org_id: orgId,
    actor,
    action,
    target_table,
    target_ids,
    details
  })
  
  if (error) {
    console.error('Failed to log action:', error)
  }
}
