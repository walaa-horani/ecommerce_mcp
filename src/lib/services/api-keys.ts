import { createHash, randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Generates a new API key and its corresponding hash for storage.
 * To be used by the vendor dashboard API key generation endpoint.
 */
export function generateApiKeySecret(): { rawKey: string; keyHash: string } {
  const rawKey = 'mcp_' + randomBytes(24).toString('base64url')
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  return { rawKey, keyHash }
}

/**
 * Verifies a raw API key and returns the associated org_id.
 * Used by the Remote MCP server to authenticate incoming requests.
 */
export async function verifyApiKey(
  supabase: SupabaseClient,
  rawKey: string
): Promise<string | null> {
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('org_id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) {
    return null
  }

  return data.org_id
}
