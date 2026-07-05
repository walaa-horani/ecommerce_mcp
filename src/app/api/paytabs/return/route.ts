import { NextResponse } from 'next/server'

// PayTabs sends the customer back to this URL via a cross-site POST.
// SameSite=Lax cookies are NOT sent on a redirect-follow from a cross-site
// POST (most modern browsers treat the entire redirect chain as cross-site).
//
// Fix: return an HTML page with a client-side redirect (<meta refresh> +
// JS fallback). The browser renders the page, then performs a fresh top-level
// navigation — a brand-new GET that IS same-site, so the auth cookie flows.
// The plan change itself is handled by the verified webhook, not here.

function landingHtml(): NextResponse {
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''
  const dest = `${site}/dashboard?upgrade=complete`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${dest}" />
  <title>Redirecting…</title>
</head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFC;color:#0F172A;">
  <p>Redirecting to your dashboard…</p>
  <script>window.location.replace(${JSON.stringify(dest)})</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

// Accept both POST (PayTabs default) and GET (manual revisit / bookmarks).
export async function POST() {
  return landingHtml()
}

export async function GET() {
  return landingHtml()
}
