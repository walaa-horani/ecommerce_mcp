'use server'

import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import { generateApiKeySecret } from '@/lib/services/api-keys'

/**
 * Generates a new API Key for the authenticated vendor organization.
 * Saves the hashed key in the database and returns the raw key ONCE.
 */
export async function generateVendorApiKey(name: string): Promise<string> {
  const supabase = await createClient()
  const viewer = await getViewer(supabase)

  if (!viewer.userId || !viewer.isVendor) {
    throw new Error('Unauthorized: Only vendors can generate API keys.')
  }

  // Retrieve the organization ID for the vendor
  const { data: memberData, error: memberError } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', viewer.userId)
    .single()

  if (memberError || !memberData?.org_id) {
    throw new Error('Could not find your vendor organization.')
  }

  const orgId = memberData.org_id
  const { rawKey, keyHash } = generateApiKeySecret()

  // Insert the hashed key into the database
  const { error: insertError } = await supabase
    .from('api_keys')
    .insert({
      org_id: orgId,
      key_hash: keyHash,
      name: name,
    })

  if (insertError) {
    console.error('Database error inserting API key:', insertError)
    throw new Error('Failed to save the new API key.')
  }

  // Return the raw key back to the client UI to be displayed exactly once
  return rawKey
}
