'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import { savePlatformSettings, setVendorActive, setVendorPlan } from '@/lib/services/admin'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Verify platform-admin from the session on every call (SKILLS.md §6). RLS is
// the second gate: organizations UPDATE and platform_settings are admin-only.
async function requireAdmin(supabase: SupabaseClient): Promise<void> {
  const viewer = await getViewer(supabase)
  if (!viewer.userId) throw new Error('You must be signed in.')
  if (!viewer.isAdmin) throw new Error('Platform admin access required.')
}

function fail(e: unknown, fallback: string): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : fallback }
}

export async function setVendorPlanAction(
  orgId: string,
  plan: 'free' | 'pro'
): Promise<ActionResult> {
  try {
    if (plan !== 'free' && plan !== 'pro') return { ok: false, error: 'Invalid plan.' }
    const supabase = await createClient()
    await requireAdmin(supabase)
    await setVendorPlan(supabase, orgId, plan)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not change plan.')
  }
}

export async function setVendorActiveAction(
  orgId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await requireAdmin(supabase)
    await setVendorActive(supabase, orgId, isActive)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not change status.')
  }
}

const settingsSchema = z.object({
  globalFee: z.coerce.number().min(0),
  freePlanCost: z.coerce.number().min(0),
  proPlanCost: z.coerce.number().min(0),
  platformStatus: z.coerce.boolean(),
  globalBanner: z.string(),
})

export async function savePlatformSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = settingsSchema.safeParse({
      globalFee: formData.get('globalFee'),
      freePlanCost: formData.get('freePlanCost'),
      proPlanCost: formData.get('proPlanCost'),
      platformStatus: formData.get('platformStatus') === 'true',
      globalBanner: formData.get('globalBanner') ?? '',
    })
    if (!parsed.success) return { ok: false, error: 'Check the settings values.' }

    const supabase = await createClient()
    await requireAdmin(supabase)
    await savePlatformSettings(supabase, parsed.data)
    revalidatePath('/admin')
    revalidatePath('/', 'layout') // storefront banner reads platform_settings
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not save settings.')
  }
}
