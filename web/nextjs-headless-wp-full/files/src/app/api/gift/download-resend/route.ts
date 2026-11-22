import { NextResponse } from 'next/server'
import { SOMETHING_WRONG, clientIpOf, resendGuideLink } from '@/lib/broadkast-gifts'

// Same-origin proxy: asks Broadkast to email a fresh download link for a purchase.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId : ''
  if (!purchaseId) {
    return NextResponse.json({ ok: false, message: SOMETHING_WRONG }, { status: 400 })
  }
  const result = await resendGuideLink({ purchaseId, ip: clientIpOf(request.headers) })
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
