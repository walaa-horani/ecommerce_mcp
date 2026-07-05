import type { SupabaseClient } from '@supabase/supabase-js'

export async function signUpVendor(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signUp({ email, password })
}

export async function signInVendor(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function getOwnMembership(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('memberships')
    .select('org_id, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function isCustomerAccount(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

export async function createStore(
  supabase: SupabaseClient,
  name: string,
  slug: string
) {
  const { data, error } = await supabase
    .rpc('create_org_with_owner', { org_name: name, org_slug: slug })
    .single()

  if (error) throw error
  return data
}
