import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS, so it is used in exactly ONE
 * place: the PayTabs webhook, and only AFTER the callback signature has been
 * verified (SKILLS.md §2 — service role behind a manually-verified check).
 * Never import this into anything reachable by unverified user input.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY).')
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
