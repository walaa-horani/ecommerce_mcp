import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCartSummary } from '@/lib/services/cart'
import CartView from './CartView'

export const metadata: Metadata = {
  title: 'Shopping Cart - Kinetic Ledger',
}

export default async function CartPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The cart is customer-only; send guests to sign in and return here after.
  if (!user) redirect('/account/login?redirect=/cart')

  const summary = await getCartSummary(supabase, user.id)

  return <CartView summary={summary} />
}
