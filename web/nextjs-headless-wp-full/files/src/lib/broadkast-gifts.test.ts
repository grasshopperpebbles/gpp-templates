import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { clientIpOf, decodeKeyword, fetchGift, subscribeForGift } from './broadkast-gifts.ts'

const realFetch = globalThis.fetch
let calls: Array<{ url: string; init?: RequestInit }> = []

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    return impl(String(url), init)
  }) as typeof fetch
}

beforeEach(() => {
  calls = []
  process.env.BROADKAST_API_URL = 'https://api.example.com'
  process.env.BROADKAST_WEBSITE_ID = 'my-shop'
})
afterEach(() => {
  globalThis.fetch = realFetch
})

test('fetchGift maps 200 to the gift object and asks for no-store', async () => {
  mockFetch(async () =>
    new Response(JSON.stringify({ name: 'Cheat Sheet', audience: 'new investors', brandName: 'Acme' }), { status: 200 })
  )
  const gift = await fetchGift('CHEAT')
  assert.deepEqual(gift, { name: 'Cheat Sheet', audience: 'new investors', brandName: 'Acme' })
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/gifts/my-shop/CHEAT')
  assert.equal(calls[0].init?.cache, 'no-store')
})

test('fetchGift returns null on 404', async () => {
  mockFetch(async () => new Response('{}', { status: 404 }))
  assert.equal(await fetchGift('NOPE'), null)
})

test('fetchGift returns null on network error', async () => {
  mockFetch(async () => {
    throw new Error('down')
  })
  assert.equal(await fetchGift('CHEAT'), null)
})

test('subscribeForGift posts the exact body without attributionToken when absent', async () => {
  mockFetch(async () => new Response(JSON.stringify({ success: true, message: 'Check your email.' }), { status: 200 }))
  const res = await subscribeForGift({ email: 'a@b.com', keyword: 'CHEAT' })
  assert.deepEqual(res, { ok: true, message: 'Check your email.' })
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/subscribe')
  assert.equal(calls[0].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    website_id: 'my-shop',
    email: 'a@b.com',
    gift: 'CHEAT',
  })
})

test('subscribeForGift includes attributionToken when given', async () => {
  mockFetch(async () => new Response(JSON.stringify({ success: true, message: 'ok' }), { status: 200 }))
  await subscribeForGift({ email: 'a@b.com', keyword: 'CHEAT', attributionToken: 'tok' })
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    website_id: 'my-shop',
    email: 'a@b.com',
    gift: 'CHEAT',
    attributionToken: 'tok',
  })
})

test('subscribeForGift maps 404 to the unavailable message', async () => {
  mockFetch(async () => new Response('{}', { status: 404 }))
  assert.deepEqual(await subscribeForGift({ email: 'a@b.com', keyword: 'X' }), {
    ok: false,
    message: "This gift isn't available.",
  })
})

test('subscribeForGift fails softly on network error', async () => {
  mockFetch(async () => {
    throw new Error('down')
  })
  const res = await subscribeForGift({ email: 'a@b.com', keyword: 'X' })
  assert.equal(res.ok, false)
})

test('subscribeForGift forwards the visitor IP as X-Forwarded-For', async () => {
  mockFetch(async () => new Response(JSON.stringify({ success: true, message: 'ok' }), { status: 200 }))
  await subscribeForGift({ email: 'a@b.com', keyword: 'CHEAT', ip: '203.0.113.9' })
  assert.equal(new Headers(calls[0].init?.headers).get('x-forwarded-for'), '203.0.113.9')
})

test('subscribeForGift sends no X-Forwarded-For without an IP', async () => {
  mockFetch(async () => new Response(JSON.stringify({ success: true, message: 'ok' }), { status: 200 }))
  await subscribeForGift({ email: 'a@b.com', keyword: 'CHEAT' })
  assert.equal(new Headers(calls[0].init?.headers).get('x-forwarded-for'), null)
})

test('subscribeForGift maps 429 to a try-again message', async () => {
  mockFetch(async () => new Response(JSON.stringify({ success: false, error: 'Too many requests.' }), { status: 429 }))
  assert.deepEqual(await subscribeForGift({ email: 'a@b.com', keyword: 'X' }), {
    ok: false,
    message: 'Too many requests right now. Try again in a minute.',
  })
})

test('clientIpOf takes the first x-forwarded-for hop, else x-real-ip', () => {
  assert.equal(clientIpOf(new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' })), '198.51.100.1')
  assert.equal(clientIpOf(new Headers({ 'x-real-ip': '198.51.100.2' })), '198.51.100.2')
  assert.equal(clientIpOf(new Headers()), undefined)
})

test('the API base URL is the server-only BROADKAST_API_URL, read at call time', async () => {
  process.env.BROADKAST_API_URL = 'https://other.example.com/'
  mockFetch(async () => new Response('{}', { status: 404 }))
  await fetchGift('CHEAT')
  assert.equal(calls[0].url, 'https://other.example.com/v1/public/gifts/my-shop/CHEAT')
})

test('decodeKeyword never throws on a stray %', () => {
  assert.equal(decodeKeyword('%'), '%')
  assert.equal(decodeKeyword('VIDEO'), 'VIDEO')
  assert.equal(decodeKeyword('V%C3%A9'), 'Vé')
})
