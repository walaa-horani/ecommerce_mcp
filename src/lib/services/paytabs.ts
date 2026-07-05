import crypto from 'crypto'

// Thin PayTabs client. Credentials live only in server env (SKILLS.md §15/§16).
// Base URL is configurable because PayTabs Turkiye's domain is account-specific.

interface PayTabsConfig {
  profileId: string
  serverKey: string
  baseUrl: string
}

function config(): PayTabsConfig {
  const profileId = process.env.PAYTABS_PROFILE_ID
  const serverKey = process.env.PAYTABS_SERVER_KEY
  const baseUrl = process.env.PAYTABS_BASE_URL || 'https://secure-global.paytabs.com'
  if (!profileId || !serverKey) {
    throw new Error('PayTabs is not configured (PAYTABS_PROFILE_ID / PAYTABS_SERVER_KEY).')
  }
  return { profileId, serverKey, baseUrl: baseUrl.replace(/\/$/, '') }
}

export interface CreatePaymentInput {
  cartId: string
  amount: number
  currency: string
  description: string
  customerName: string
  customerEmail: string
  callbackUrl: string
  returnUrl: string
}

export interface CreatePaymentResult {
  redirectUrl: string
  tranRef: string
}

/**
 * Creates a PayTabs hosted payment page and returns the redirect URL the vendor
 * is sent to. Server key is passed as the Authorization header per PayTabs.
 */
export async function createHostedPaymentPage(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const { profileId, serverKey, baseUrl } = config()

  const res = await fetch(`${baseUrl}/payment/request`, {
    method: 'POST',
    headers: {
      authorization: serverKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      profile_id: profileId,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: input.cartId,
      cart_description: input.description,
      cart_currency: input.currency,
      cart_amount: Number(input.amount.toFixed(2)),
      callback: input.callbackUrl,
      return: input.returnUrl,
      hide_shipping: true,
      customer_details: {
        name: input.customerName,
        email: input.customerEmail,
        street1: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'TR',
        zip: '00000',
      },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.redirect_url || !data.tran_ref) {
    const msg = data?.message || data?.result || `PayTabs request failed (${res.status}).`
    throw new Error(typeof msg === 'string' ? msg : 'PayTabs request failed.')
  }
  return { redirectUrl: data.redirect_url, tranRef: data.tran_ref }
}

/**
 * Verifies a server-to-server callback: HMAC-SHA256 of the exact raw request
 * body, keyed with the server key, compared (constant-time) to the `signature`
 * header. Nothing in the payload is trusted until this returns true (§15).
 */
export function verifyCallbackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false
  let serverKey: string
  try {
    serverKey = config().serverKey
  } catch {
    // Not configured -> cannot verify -> reject rather than throw.
    return false
  }
  const expected = crypto.createHmac('sha256', serverKey).update(rawBody, 'utf8').digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signatureHeader, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
