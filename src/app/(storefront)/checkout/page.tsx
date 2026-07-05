import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCartSummary } from '@/lib/services/cart'
import CheckoutForm from '@/components/storefront/CheckoutForm'

export const metadata: Metadata = { title: 'Checkout - Kinetic Ledger' }

const TAX_RATE = 0.1

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/account/login?redirect=/checkout')

  const summary = await getCartSummary(supabase, user.id)
  if (summary.groups.length === 0) redirect('/cart')

  const tax = Number((summary.subtotal * TAX_RATE).toFixed(2))
  const total = Number((summary.subtotal + tax).toFixed(2))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 border-b border-[#E2E8F0] pb-3">Secure Checkout</h1>
      <CheckoutForm subtotal={summary.subtotal} tax={tax} total={total} />
    </div>
  )
}
