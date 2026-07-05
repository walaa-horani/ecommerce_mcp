import type { SupabaseClient } from '@supabase/supabase-js'

// A single product line in the customer's cart, flattened from the
// cart_items -> products -> organizations join for easy rendering.
export interface CartLineItem {
  id: string // cart_items.id
  productId: string
  name: string
  price: number
  imageUrl: string | null
  sku: string
  orgId: string
  vendorName: string
  quantity: number
  lineTotal: number
}

// Line items grouped under one vendor (organization).
export interface CartVendorGroup {
  orgId: string
  vendorName: string
  items: CartLineItem[]
}

export interface CartSummary {
  groups: CartVendorGroup[]
  itemCount: number // total quantity across all items
  subtotal: number
}

const EMPTY_SUMMARY: CartSummary = { groups: [], itemCount: 0, subtotal: 0 }

// Shape returned by the Supabase join query below. The nested relations come
// back as objects (or arrays, depending on FK inference), so we normalize both.
type JoinedOrg = { name: string | null } | { name: string | null }[] | null
type JoinedProduct = {
  id: string
  name: string
  price: number | string
  image_url: string | null
  sku: string
  org_id: string
  organizations: JoinedOrg
} | null
type JoinedCartItem = {
  id: string
  quantity: number
  products: JoinedProduct | JoinedProduct[]
}

function first<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

/**
 * Returns the customer's cart id, creating an empty cart row on first use.
 * RLS (`customer_id = auth.uid()`) restricts this to the caller's own cart.
 */
export async function getOrCreateCartId(
  supabase: SupabaseClient,
  customerId: string
): Promise<string> {
  const { data: existing, error } = await supabase
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (error) throw error
  if (existing) return existing.id

  const { data, error: insertError } = await supabase
    .from('carts')
    .insert({ customer_id: customerId })
    .select('id')
    .single()
  if (insertError) throw insertError
  return data.id
}

/**
 * Loads the customer's cart, joined to product + vendor details, grouped by
 * vendor with per-line and cart-level totals. Read-only; returns an empty
 * summary when the customer has no cart yet.
 */
export async function getCartSummary(
  supabase: SupabaseClient,
  customerId: string
): Promise<CartSummary> {
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (cartError) throw cartError
  if (!cart) return EMPTY_SUMMARY

  const { data: rows, error } = await supabase
    .from('cart_items')
    .select(
      'id, quantity, products(id, name, price, image_url, sku, org_id, organizations(name))'
    )
    .eq('cart_id', cart.id)
    .order('id')
  if (error) throw error

  const groupsByOrg = new Map<string, CartVendorGroup>()
  let itemCount = 0
  let subtotal = 0

  for (const row of (rows ?? []) as JoinedCartItem[]) {
    const product = first(row.products)
    if (!product) continue // product removed/unpublished — skip defensively

    const org = first(product.organizations)
    const vendorName = org?.name ?? 'Unknown vendor'
    const price = Number(product.price)
    const lineTotal = price * row.quantity

    const item: CartLineItem = {
      id: row.id,
      productId: product.id,
      name: product.name,
      price,
      imageUrl: product.image_url,
      sku: product.sku,
      orgId: product.org_id,
      vendorName,
      quantity: row.quantity,
      lineTotal,
    }

    itemCount += row.quantity
    subtotal += lineTotal

    const group = groupsByOrg.get(product.org_id)
    if (group) {
      group.items.push(item)
    } else {
      groupsByOrg.set(product.org_id, {
        orgId: product.org_id,
        vendorName,
        items: [item],
      })
    }
  }

  return {
    groups: [...groupsByOrg.values()],
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
  }
}

/**
 * Adds a product to the customer's cart (or increments it if already present).
 * org_id is resolved server-side from the product row — never trusted from the
 * client (see SKILLS.md §4/§5). RLS enforces cart ownership.
 */
export async function addItemToCart(
  supabase: SupabaseClient,
  customerId: string,
  productId: string,
  quantity: number
): Promise<void> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, org_id, is_published')
    .eq('id', productId)
    .maybeSingle()
  if (productError) throw productError
  if (!product || !product.is_published) {
    throw new Error('This product is no longer available.')
  }

  const cartId = await getOrCreateCartId(supabase, customerId)

  // No unique (cart_id, product_id) constraint, so upsert by hand.
  const { data: existing, error: existingError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('cart_items').insert({
      cart_id: cartId,
      product_id: productId,
      org_id: product.org_id,
      quantity,
    })
    if (error) throw error
  }
}

/** Sets a cart line's quantity. RLS (`owns_cart`) restricts this to the caller. */
export async function setCartItemQuantity(
  supabase: SupabaseClient,
  itemId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
  if (error) throw error
}

/** Removes a cart line. RLS (`owns_cart`) restricts this to the caller. */
export async function removeCartItemById(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', itemId)
  if (error) throw error
}

/**
 * Turns the customer's cart into one order per vendor (orders + order_items),
 * then empties the cart. org_id and unit_price come from the server-side cart
 * summary, never client input (SKILLS.md §5).
 *
 * NOTE: §5 also requires a `recordStockMovement` (type: out) per line item and
 * an audit entry. Those services do not exist in the repo yet, and
 * `product_stock` is unseeded — wire this in when the inventory service lands.
 */
export interface ShippingAddress {
  fullName: string
  address: string
  city: string
  zip: string
  country: string
}

export async function createOrdersFromCart(
  supabase: SupabaseClient,
  customerId: string,
  shippingAddress: ShippingAddress
): Promise<{ orderCount: number; total: number }> {
  const summary = await getCartSummary(supabase, customerId)
  if (summary.groups.length === 0) {
    throw new Error('Your cart is empty.')
  }

  let total = 0
  for (const group of summary.groups) {
    const orderTotal = group.items.reduce((sum, i) => sum + i.lineTotal, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        org_id: group.orgId,
        customer_id: customerId,
        shipping_address: shippingAddress,
        status: 'pending',
        total_amount: Number(orderTotal.toFixed(2)),
      })
      .select('id')
      .single()
    if (orderError) throw orderError

    const { error: itemsError } = await supabase.from('order_items').insert(
      group.items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        quantity: i.quantity,
        unit_price: i.price,
      }))
    )
    if (itemsError) throw itemsError

    total += orderTotal
  }

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .maybeSingle()
  if (cart) {
    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
    if (clearError) throw clearError
  }

  return { orderCount: summary.groups.length, total: Number(total.toFixed(2)) }
}
