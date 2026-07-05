import { NextResponse } from 'next/server'
import { verifyCallbackSignature } from '@/lib/services/paytabs'
import { applyVerifiedCallback, type PaytabsCallback } from '@/lib/services/billing'
import { createAdminClient } from '@/lib/supabase/admin'

// PayTabs server-to-server callback. NOTHING in the body is trusted until the
// signature is verified against the raw bytes with the server key (SKILLS.md
// §15). Only a verified "authorised" result sets plan='pro' + writes payments.
export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('signature')

  if (!verifyCallbackSignature(rawBody, signature)) {
    // Untrusted origin — do not touch the DB.
    console.warn('[paytabs] rejected callback: invalid or missing signature')
    return new NextResponse('invalid signature', { status: 400 })
  }

  let payload: PaytabsCallback
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('invalid payload', { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { success } = await applyVerifiedCallback(admin, payload)
    console.info(`[paytabs] callback applied: tran=${payload.tran_ref} success=${success}`)
  } catch (e) {
    console.error('[paytabs] failed to apply verified callback:', e)
    return new NextResponse('processing error', { status: 500 })
  }

  // 200 so PayTabs stops retrying.
  return NextResponse.json({ received: true })
}
