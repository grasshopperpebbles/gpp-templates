// Server-side client for the Broadkast public gift endpoints.
// BROADKAST_API_URL is server-only (not NEXT_PUBLIC_*), so it is read at run time, not inlined at build time.

export interface Gift {
  name: string
  audience: string
  brandName: string
}

export const GIFT_UNAVAILABLE = "This gift isn't available."
export const TOO_MANY = 'Too many requests right now. Try again in a minute.'

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
    return { ok: false, message: data.message || 'Something went wrong. Please try again.' }
  } catch {
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
