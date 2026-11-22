// Server-side client for the Broadkast public gift endpoints.
// BROADKAST_API_URL is server-only (not NEXT_PUBLIC_*), so it is read at run time, not inlined at build time.

export interface Gift {
  name: string
  audience: string
  brandName: string
}

export const GIFT_UNAVAILABLE = "This gift isn't available."
export const TOO_MANY = 'Too many requests right now. Try again in a minute.'
export const THANKS_EXPIRED = 'This link has expired. Check your email for the latest one.'
export const THANKS_UNAVAILABLE = "This page isn't available right now. Try again in a few minutes."
export const ALREADY_BOUGHT = 'You already have this guide. The download link is in your email.'
export const SOMETHING_WRONG = 'Something went wrong. Please try again.'

/** The visitor's IP from this request: the first x-forwarded-for hop, else x-real-ip. */
export function clientIpOf(headers: Headers): string | undefined {
  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return first || headers.get('x-real-ip')?.trim() || undefined
}

/** The page's keyword segment, decoded once; a malformed one (a stray %) is used as is. */
export function decodeKeyword(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function config() {
  const base = (process.env.BROADKAST_API_URL || '').replace(/\/+$/, '')
  const websiteId = process.env.BROADKAST_WEBSITE_ID || ''
  return { base, websiteId }
}

export async function fetchGift(keyword: string): Promise<Gift | null> {
  const { base, websiteId } = config()
  if (!base || !websiteId) return null
  try {
    const res = await fetch(
      `${base}/v1/public/gifts/${encodeURIComponent(websiteId)}/${encodeURIComponent(keyword)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return { name: data.name, audience: data.audience, brandName: data.brandName }
  } catch {
    return null
  }
}

export async function subscribeForGift(input: {
  email: string
  keyword: string
  attributionToken?: string
  /** The visitor's IP, forwarded so Broadkast's per-IP limit counts each visitor, not this server. */
  ip?: string
}): Promise<{ ok: boolean; message: string }> {
  const { base, websiteId } = config()
  const body: Record<string, string> = {
    website_id: websiteId,
    email: input.email,
    gift: input.keyword,
  }
  if (input.attributionToken) body.attributionToken = input.attributionToken
  try {
    const res = await fetch(`${base}/v1/public/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(input.ip ? { 'X-Forwarded-For': input.ip } : {}) },
      body: JSON.stringify(body),
    })
    if (res.status === 404) return { ok: false, message: GIFT_UNAVAILABLE }
    if (res.status === 429) return { ok: false, message: TOO_MANY }
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success) return { ok: true, message: data.message }
    return { ok: false, message: data.message || SOMETHING_WRONG }
  } catch {
    return { ok: false, message: SOMETHING_WRONG }
  }
}

// ---- Thank-you page ----

export interface ThanksView {
  brandName: string
  gift: { name: string; downloadUrl: string }
  offer: null | {
    pitchLine: string
    productName: string
    priceMinor: number
    currency: string
    canBuy: boolean
    bought: boolean
    refundDays: number
  }
  survey: Array<{ question: string; answered: boolean }>
  waitlist: null | { kitName: string; kitDescription: string; joined: boolean }
}

export type ThanksResult = { kind: 'ok'; view: ThanksView } | { kind: 'invalid' } | { kind: 'unavailable' }

export type ActionResult = { ok: true; url?: string } | { ok: false; message: string; expired?: boolean }

type SearchParams = Record<string, string | string[] | undefined>

/** The thank-you page's query: the first value of each key, plus the purchase and expired-download flags. */
export function readThanksParams(sp: SearchParams): {
  s: string
  purchaseDone: boolean
  downloadExpired: boolean
  purchaseId: string | null
} {
  const first = (key: string): string => {
    const v = sp[key]
    return (Array.isArray(v) ? v[0] : v) ?? ''
  }
  return {
    s: first('s'),
    purchaseDone: first('purchase') === 'done',
    downloadExpired: first('download') === 'expired',
    purchaseId: first('purchaseId') || null,
  }
}

/** "$19", "$19.50", "¥500": a whole amount drops the decimals. */
export function formatPrice(priceMinor: number, currency: string): string {
  const base = { style: 'currency' as const, currency: currency.toUpperCase() }
  const digits = new Intl.NumberFormat('en', base).resolvedOptions().maximumFractionDigits ?? 2
  const amount = priceMinor / 10 ** digits
  const whole = Number.isInteger(amount)
  return new Intl.NumberFormat('en', {
    ...base,
    minimumFractionDigits: whole ? 0 : digits,
    maximumFractionDigits: whole ? 0 : digits,
  }).format(amount)
}

function forwarded(ip?: string): Record<string, string> {
  return ip ? { 'X-Forwarded-For': ip } : {}
}

function thanksBase(keyword: string): string | null {
  const { base, websiteId } = config()
  if (!base || !websiteId) return null
  return `${base}/v1/public/gifts/${encodeURIComponent(websiteId)}/${encodeURIComponent(keyword)}/thanks`
}

export async function fetchThanks(keyword: string, s: string, ip?: string): Promise<ThanksResult> {
  if (!s) return { kind: 'invalid' }
  const base = thanksBase(keyword)
  if (!base) return { kind: 'unavailable' }
  try {
    const res = await fetch(`${base}?s=${encodeURIComponent(s)}`, { cache: 'no-store', headers: forwarded(ip) })
    if (res.status === 404) return { kind: 'invalid' }
    if (res.status !== 200) return { kind: 'unavailable' }
    return { kind: 'ok', view: (await res.json()) as ThanksView }
  } catch {
    return { kind: 'unavailable' }
  }
}

type PostedBody = { url?: unknown }
type PostResult = ActionResult & { data?: PostedBody }

async function postAction(url: string | null, body: unknown, ip?: string): Promise<PostResult> {
  if (!url) return { ok: false, message: SOMETHING_WRONG }
  try {
    const res = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...forwarded(ip) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const data = ((await res.json().catch(() => null)) ?? {}) as PostedBody & { code?: unknown }
    if (res.ok) return { ok: true, data }
    if (res.status === 404) return { ok: false, message: THANKS_EXPIRED, expired: true }
    if (res.status === 429) return { ok: false, message: TOO_MANY }
    if (res.status === 409 && data.code === 'CHECKOUT_ALREADY_BOUGHT') return { ok: false, message: ALREADY_BOUGHT }
    return { ok: false, message: SOMETHING_WRONG }
  } catch {
    return { ok: false, message: SOMETHING_WRONG }
  }
}

function plain(r: PostResult): ActionResult {
  return r.ok ? { ok: true } : r
}

export async function sendSurvey(i: {
  keyword: string
  s: string
  answers: Array<{ question: string; answer: string }>
  ip?: string
}): Promise<ActionResult> {
  const base = thanksBase(i.keyword)
  return plain(await postAction(base && `${base}/survey`, { s: i.s, answers: i.answers }, i.ip))
}

export async function joinKitWaitlist(i: { keyword: string; s: string; ip?: string }): Promise<ActionResult> {
  const base = thanksBase(i.keyword)
  return plain(await postAction(base && `${base}/waitlist`, { s: i.s }, i.ip))
}

export async function startGuideCheckout(i: { keyword: string; s: string; ip?: string }): Promise<ActionResult> {
  const base = thanksBase(i.keyword)
  const r = await postAction(base && `${base}/checkout`, { s: i.s }, i.ip)
  if (!r.ok) return r
  const url = r.data?.url
  if (typeof url !== 'string' || !url.startsWith('https://')) return { ok: false, message: SOMETHING_WRONG }
  return { ok: true, url }
}

export async function resendGuideLink(i: { purchaseId: string; ip?: string }): Promise<ActionResult> {
  const { base } = config()
  const url = base ? `${base}/v1/public/downloads/${encodeURIComponent(i.purchaseId)}/resend` : null
  return plain(await postAction(url, undefined, i.ip))
}

/** Keeps only well-formed `{ question, answer }` entries from an untrusted parsed body. */
export function cleanAnswers(raw: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(raw)) return []
  const out: Array<{ question: string; answer: string }> = []
  for (const item of raw) {
    if (item && typeof item === 'object') {
      const { question, answer } = item as Record<string, unknown>
      if (typeof question === 'string' && typeof answer === 'string') out.push({ question, answer })
    }
  }
  return out
}

/** The survey questions still waiting for an answer. */
export function unansweredQuestions(survey: ThanksView['survey']): string[] {
  return survey.filter((q) => !q.answered).map((q) => q.question)
}
