import { NextResponse } from 'next/server'
import { clientIpOf, subscribeForGift } from '@/lib/broadkast-gifts'

// Same-origin proxy: the site's CSP (connect-src 'self') blocks the browser
// from calling the Broadkast API directly.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const keyword = typeof body?.keyword === 'string' ? body.keyword : ''
  const attributionToken = typeof body?.attributionToken === 'string' ? body.attributionToken : undefined
  if (!email || !keyword) {
    return NextResponse.json({ ok: false, message: 'Enter your email.' }, { status: 400 })
  }
  const result = await subscribeForGift({ email, keyword, attributionToken, ip: clientIpOf(request.headers) })
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
