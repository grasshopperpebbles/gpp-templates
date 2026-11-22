import { NextResponse } from 'next/server'
import { THANKS_EXPIRED, cleanAnswers, clientIpOf, sendSurvey } from '@/lib/broadkast-gifts'

// Same-origin proxy for the thank-you page's survey (the site's CSP blocks direct browser calls).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const keyword = typeof body?.keyword === 'string' ? body.keyword : ''
  const s = typeof body?.s === 'string' ? body.s : ''
  if (!keyword || !s) {
    return NextResponse.json({ ok: false, message: THANKS_EXPIRED, expired: true }, { status: 400 })
  }
  const result = await sendSurvey({ keyword, s, answers: cleanAnswers(body?.answers), ip: clientIpOf(request.headers) })
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
