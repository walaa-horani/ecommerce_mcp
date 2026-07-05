import type { SupabaseClient } from '@supabase/supabase-js'

export async function signUpCustomer(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signUp({ email, password })
}

export async function signInCustomer(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function isVendorStaff(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

export async function ensureCustomerRow(
  supabase: SupabaseClient,
  userId: string,
  email: string
) {
  const { data: existing, error: selectError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return existing

  const { data, error } = await supabase
    .from('customers')
    .insert({ id: userId, email })
    .select()
    .single()

  if (error) throw error
  return data
}
