import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Viewer {
  userId: string | null
  email: string | null
  isVendor: boolean // has a membership in some org
  isAdmin: boolean // listed in platform_admins
  orgId: string | null // first vendor org, if any
}

const GUEST: Viewer = {
  userId: null,
  email: null,
  isVendor: false,
  isAdmin: false,
  orgId: null,
}

/**
 * Resolves the current viewer's real roles from Supabase (SKILLS.md §2/§6):
 * vendor = has a `memberships` row, admin = has a `platform_admins` row. Role
 * is never taken from the client. Memoized per request via React.cache so the
 * layout and page can both call it without a second round-trip.
 */
export const getViewer = cache(async (supabase: SupabaseClient): Promise<Viewer> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return GUEST

  // RLS scopes both reads to the caller: memberships returns only the viewer's
  // own orgs; platform_admins returns a row only if the viewer is an admin.
  const [{ data: memberships }, { data: admin }] = await Promise.all([
    supabase.from('memberships').select('org_id').limit(1),
    supabase.from('platform_admins').select('user_id').maybeSingle(),
  ])

  return {
    userId: user.id,
    email: user.email ?? null,
    isVendor: (memberships?.length ?? 0) > 0,
    isAdmin: admin !== null,
    orgId: memberships?.[0]?.org_id ?? null,
  }
})
