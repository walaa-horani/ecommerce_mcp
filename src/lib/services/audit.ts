import type { SupabaseClient } from '@supabase/supabase-js'

export interface LogActionParams {
  orgId: string
  actor: string
  action: string
  targetTable: string
  targetIds: string[]
  details?: Record<string, any>
}

/**
 * Logs an action to the audit_log table.
 * Used primarily by MCP tools to record writes, per SKILLS.md rule 12.
 */
export async function logAction(
  supabase: SupabaseClient,
  params: LogActionParams
): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    org_id: params.orgId,
    actor: params.actor,
    action: params.action,
    target_table: params.targetTable,
    target_ids: params.targetIds,
    details: params.details ?? null,
  })

  if (error) {
    throw error
  }
}
