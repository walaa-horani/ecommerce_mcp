import type { SupabaseClient } from '@supabase/supabase-js'
import { createHostedPaymentPage } from './paytabs'

const CART_PREFIX = 'pro'
const CURRENCY = 'TRY'

// cart_id carries the org so the verified callback can map payment -> org
// without trusting any client input. org UUIDs contain no underscores.
export function buildProCartId(orgId: string): string {
  return `${CART_PREFIX}_${orgId}_${Date.now()}`
}
export function orgIdFromCartId(cartId: string): string | null {
  const parts = cartId.split('_')
  return parts.length >= 3 && parts[0] === CART_PREFIX ? parts[1] : null
}

/**
 * Starts a Pro upgrade: reads the current Pro price, creates a PayTabs hosted
 * payment page, and returns the redirect URL. No DB write here — the plan is
 * only changed by the verified webhook.
 */
export async function startProUpgrade(
  supabase: SupabaseClient,
  params: { orgId: string; customerName: string; customerEmail: string }
): Promise<string> {
  const { data: price, error } = await supabase.rpc('get_pro_plan_cost')
  if (error) throw error
  const amount = Number(price ?? 0)
  if (amount <= 0) throw new Error('Pro plan price is not configured.')

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { redirectUrl } = await createHostedPaymentPage({
    cartId: buildProCartId(params.orgId),
    amount,
    currency: CURRENCY,
    description: 'Kinetic Ledger — Pro plan upgrade',
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    callbackUrl: `${site}/api/webhooks/paytabs`,
    // Public bounce route — see app/api/paytabs/return (cross-site POST can't
    // carry the auth cookie, so we can't return straight to the gated dashboard).
    returnUrl: `${site}/api/paytabs/return`,
  })
  return redirectUrl
}

export interface PaytabsCallback {
  tran_ref?: string
  cart_id?: string
  cart_amount?: string | number
  cart_currency?: string
  payment_result?: { response_status?: string; response_message?: string }
}

/**
 * Applies a signature-verified callback. Logs every attempt to `payments`
 * (SKILLS.md §15) and only sets plan='pro' on an authorised ('A') result.
 * Idempotent by tran_ref so PayTabs retries don't double-apply. Runs with the
 * service-role client (RLS bypassed) — caller MUST have verified the signature.
 */
export async function applyVerifiedCallback(
  admin: SupabaseClient,
  payload: PaytabsCallback
): Promise<{ orgId: string; success: boolean }> {
  const orgId = payload.cart_id ? orgIdFromCartId(payload.cart_id) : null
  if (!orgId) throw new Error('Unrecognized cart_id in callback.')

  const tranRef = payload.tran_ref ?? null
  const success = payload.payment_result?.response_status === 'A'

  // Idempotency: skip if this transaction was already recorded.
  if (tranRef) {
    const { data: existing } = await admin
      .from('payments')
      .select('id')
      .eq('paytabs_transaction_ref', tranRef)
      .maybeSingle()
    if (existing) return { orgId, success }
  }

  await admin.from('payments').insert({
    org_id: orgId,
    amount: Number(payload.cart_amount ?? 0),
    currency: payload.cart_currency ?? CURRENCY,
    paytabs_transaction_ref: tranRef,
    status: success ? 'success' : 'failed',
  })

  if (success) {
    await admin.from('organizations').update({ plan: 'pro' }).eq('id', orgId)
  }

  return { orgId, success }
}
