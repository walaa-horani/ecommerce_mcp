'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/services/roles'
import { assertPlanLimit } from '@/lib/services/plans'
import {
  createProduct,
  createPurchaseOrder,
  createWarehouse,
  updateOrderStatus,
  updateStoreName,
} from '@/lib/services/vendor-mutations'

export type ActionResult = { ok: true } | { ok: false; error: string }

// Resolve the caller's vendor org from the session — never from client input
// (SKILLS.md §4). RLS enforces org scoping beneath this.
async function requireVendorOrg(supabase: SupabaseClient): Promise<string> {
  const viewer = await getViewer(supabase)
  if (!viewer.userId) throw new Error('You must be signed in.')
  if (!viewer.isVendor || !viewer.orgId) throw new Error('No vendor org for this account.')
  return viewer.orgId
}

function fail(e: unknown, fallback: string): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : fallback }
}

const productSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  description: z.string().min(1),
  sku: z.string().min(1),
  imageUrl: z.string().min(1),
  initialStock: z.coerce.number().int().min(0),
})

export async function addProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = productSchema.safeParse({
      name: formData.get('name'),
      price: formData.get('price'),
      description: formData.get('description'),
      sku: formData.get('sku'),
      imageUrl: formData.get('imageUrl'),
      initialStock: formData.get('initialStock'),
    })
    if (!parsed.success) return { ok: false, error: 'Please fill in all product fields.' }

    const supabase = await createClient()
    const orgId = await requireVendorOrg(supabase)
    await assertPlanLimit(supabase, orgId, 'add_product')
    await createProduct(supabase, orgId, parsed.data)
    revalidatePath('/dashboard')
    revalidatePath('/')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not add product.')
  }
}

const warehouseSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
})

export async function addWarehouseAction(formData: FormData): Promise<ActionResult> {
  try {
    const parsed = warehouseSchema.safeParse({
      name: formData.get('name'),
      location: formData.get('location'),
    })
    if (!parsed.success) return { ok: false, error: 'Enter a warehouse name and location.' }

    const supabase = await createClient()
    const orgId = await requireVendorOrg(supabase)
    await assertPlanLimit(supabase, orgId, 'add_warehouse')
    await createWarehouse(supabase, orgId, parsed.data.name, parsed.data.location)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not add warehouse.')
  }
}

export async function addPurchaseOrderAction(formData: FormData): Promise<ActionResult> {
  try {
    const supplier = String(formData.get('supplier') ?? '').trim()
    if (!supplier) return { ok: false, error: 'Enter a supplier name.' }

    const supabase = await createClient()
    const orgId = await requireVendorOrg(supabase)
    await assertPlanLimit(supabase, orgId, 'purchase_orders')
    await createPurchaseOrder(supabase, orgId, supplier)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not create purchase order.')
  }
}

const STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled'] as const

export async function updateOrderStatusAction(
  orderId: string,
  status: (typeof STATUSES)[number]
): Promise<ActionResult> {
  try {
    if (!STATUSES.includes(status)) return { ok: false, error: 'Invalid status.' }
    const supabase = await createClient()
    const orgId = await requireVendorOrg(supabase)
    await updateOrderStatus(supabase, orgId, orderId, status)
    revalidatePath('/dashboard')
    revalidatePath('/account/orders')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not update order.')
  }
}

export async function updateStoreNameAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = String(formData.get('name') ?? '').trim()
    if (!name) return { ok: false, error: 'Store name is required.' }

    const supabase = await createClient()
    const orgId = await requireVendorOrg(supabase)
    await updateStoreName(supabase, orgId, name)
    revalidatePath('/dashboard')
    revalidatePath('/')
    return { ok: true }
  } catch (e) {
    return fail(e, 'Could not save settings.')
  }
}
