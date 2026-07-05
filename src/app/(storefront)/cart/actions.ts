'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { ensureCustomerRow } from '@/lib/services/customer-auth'
import {
  addItemToCart,
  createOrdersFromCart,
  removeCartItemById,
  setCartItemQuantity,
} from '@/lib/services/cart'

// Server Actions are thin wrappers (SKILLS.md §7): resolve the session, parse
// input, then delegate to the service layer. They are reachable via direct
// POST, so we verify auth on every call and never accept customer_id/org_id
// from the client (SKILLS.md §4/§5). RLS is the enforcement layer beneath this.
async function requireUser(supabase: SupabaseClient): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to manage your cart.')
  return user
}

export type CartActionResult = { ok: true } | { ok: false; error: string }

export async function addToCart(
  productId: string,
  quantity = 1
): Promise<CartActionResult> {
  if (quantity < 1) return { ok: false, error: 'Quantity must be at least 1.' }
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    // carts.customer_id -> customers.id, so ensure the customer row exists.
    await ensureCustomerRow(supabase, user.id, user.email ?? '')
    await addItemToCart(supabase, user.id, productId, quantity)
    revalidatePath('/cart')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not add to cart.' }
  }
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<CartActionResult> {
  try {
    const supabase = await createClient()
    await requireUser(supabase)
    // Dropping below 1 removes the line (cart_items.quantity has a > 0 check).
    if (quantity < 1) {
      await removeCartItemById(supabase, itemId)
    } else {
      await setCartItemQuantity(supabase, itemId, quantity)
    }
    revalidatePath('/cart')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not update quantity.' }
  }
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  try {
    const supabase = await createClient()
    await requireUser(supabase)
    await removeCartItemById(supabase, itemId)
    revalidatePath('/cart')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not remove item.' }
  }
}

export type CheckoutResult =
  | { ok: true; orderCount: number; total: number }
  | { ok: false; error: string }

const shippingSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  zip: z.string().min(1, 'ZIP / postal code is required.'),
  country: z.string().min(1, 'Country is required.'),
})

export async function checkout(formData: FormData): Promise<CheckoutResult> {
  try {
    const parsed = shippingSchema.safeParse({
      fullName: formData.get('fullName'),
      address: formData.get('address'),
      city: formData.get('city'),
      zip: formData.get('zip'),
      country: formData.get('country'),
    })
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid shipping details.' }
    }

    const supabase = await createClient()
    const user = await requireUser(supabase)
    const { orderCount, total } = await createOrdersFromCart(supabase, user.id, parsed.data)
    revalidatePath('/cart')
    revalidatePath('/account/orders')
    return { ok: true, orderCount, total }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Checkout failed.' }
  }
}
