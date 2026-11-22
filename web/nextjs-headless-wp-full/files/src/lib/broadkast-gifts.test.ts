import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALREADY_BOUGHT,
  SOMETHING_WRONG,
  THANKS_EXPIRED,
  THANKS_UNAVAILABLE,
  TOO_MANY,
  cleanAnswers,
  clientIpOf,
  decodeKeyword,
  fetchGift,
  fetchThanks,
  formatPrice,
  joinKitWaitlist,
  readThanksParams,
  resendGuideLink,
  sendSurvey,
  startGuideCheckout,
  subscribeForGift,
  unansweredQuestions,
} from './broadkast-gifts.ts'

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

const VIEW = {
  brandName: 'Acme',
  gift: { name: 'Cheat Sheet', downloadUrl: 'https://api.example.com/v1/public/downloads/x' },
  offer: {
    pitchLine: 'Go further',
    productName: 'Make Your First AI Video',
    priceMinor: 1900,
    currency: 'usd',
    canBuy: true,
    bought: false,
    refundDays: 30,
  },
  survey: [
    { question: 'What do you make?', answered: false },
    { question: 'Biggest block?', answered: true },
  ],
  waitlist: { kitName: 'Creator Kit', kitDescription: 'Templates', joined: false },
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

test('fetchThanks asks for the encoded keyword and token with no-store', async () => {
  mockFetch(async () => json(VIEW))
  await fetchThanks('VIDEO', 'a.b/c+d')
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/gifts/my-shop/VIDEO/thanks?s=a.b%2Fc%2Bd')
  assert.equal(calls[0].init?.cache, 'no-store')
})

test('fetchThanks maps 200 to the view', async () => {
  mockFetch(async () => json(VIEW))
  assert.deepEqual(await fetchThanks('VIDEO', 't'), { kind: 'ok', view: VIEW })
})

test('fetchThanks: 404 is invalid; 500 and a network error are unavailable', async () => {
  mockFetch(async () => json({ code: 'THANKS_LINK_INVALID' }, 404))
  assert.deepEqual(await fetchThanks('VIDEO', 't'), { kind: 'invalid' })
  mockFetch(async () => json({}, 500))
  assert.deepEqual(await fetchThanks('VIDEO', 't'), { kind: 'unavailable' })
  mockFetch(async () => {
    throw new Error('down')
  })
  assert.deepEqual(await fetchThanks('VIDEO', 't'), { kind: 'unavailable' })
})

test('fetchThanks with an empty token is invalid and fetches nothing', async () => {
  mockFetch(async () => json(VIEW))
  assert.deepEqual(await fetchThanks('VIDEO', ''), { kind: 'invalid' })
  assert.equal(calls.length, 0)
})

test('fetchThanks forwards the visitor IP', async () => {
  mockFetch(async () => json(VIEW))
  await fetchThanks('VIDEO', 't', '203.0.113.9')
  assert.equal((calls[0].init?.headers as Record<string, string>)['X-Forwarded-For'], '203.0.113.9')
})

test('readThanksParams takes the first value and reads the flags', () => {
  assert.deepEqual(readThanksParams({ s: ['t1', 't2'], purchase: 'done' }), {
    s: 't1',
    purchaseDone: true,
    downloadExpired: false,
    purchaseId: null,
  })
  assert.deepEqual(readThanksParams({ s: 't', download: 'expired', purchaseId: 'p1' }), {
    s: 't',
    purchaseDone: false,
    downloadExpired: true,
    purchaseId: 'p1',
  })
  assert.equal(readThanksParams({}).s, '')
})

test('formatPrice', () => {
  assert.equal(formatPrice(1900, 'usd'), '$19')
  assert.equal(formatPrice(1950, 'usd'), '$19.50')
  assert.equal(formatPrice(1900, 'EUR'), '€19')
  assert.equal(formatPrice(500, 'jpy'), '¥500')
})

test('sendSurvey posts { s, answers } to the survey path', async () => {
  mockFetch(async () => json({ saved: 1 }))
  const answers = [{ question: 'What do you make?', answer: 'Videos' }]
  assert.deepEqual(await sendSurvey({ keyword: 'VIDEO', s: 'tok', answers }), { ok: true })
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/gifts/my-shop/VIDEO/thanks/survey')
  assert.equal(calls[0].init?.method, 'POST')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { s: 'tok', answers })
})

test('joinKitWaitlist posts { s } to the waitlist path', async () => {
  mockFetch(async () => json({ joined: true }))
  assert.deepEqual(await joinKitWaitlist({ keyword: 'VIDEO', s: 'tok', ip: '1.2.3.4' }), { ok: true })
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/gifts/my-shop/VIDEO/thanks/waitlist')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { s: 'tok' })
  assert.equal((calls[0].init?.headers as Record<string, string>)['X-Forwarded-For'], '1.2.3.4')
})

test('startGuideCheckout returns the Stripe URL', async () => {
  mockFetch(async () => json({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }))
  assert.deepEqual(await startGuideCheckout({ keyword: 'VIDEO', s: 'tok' }), {
    ok: true,
    url: 'https://checkout.stripe.com/c/pay/cs_test_1',
  })
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/gifts/my-shop/VIDEO/thanks/checkout')
})

test('startGuideCheckout refuses a non-https url', async () => {
  for (const body of [{ url: 'javascript:alert(1)' }, { url: 'http://x' }, {}]) {
    mockFetch(async () => json(body))
    assert.deepEqual(await startGuideCheckout({ keyword: 'VIDEO', s: 'tok' }), { ok: false, message: SOMETHING_WRONG })
  }
})

test('startGuideCheckout: 409 CHECKOUT_ALREADY_BOUGHT is ALREADY_BOUGHT; 409 CHECKOUT_OFF is SOMETHING_WRONG', async () => {
  mockFetch(async () => json({ code: 'CHECKOUT_ALREADY_BOUGHT' }, 409))
  assert.deepEqual(await startGuideCheckout({ keyword: 'VIDEO', s: 'tok' }), { ok: false, message: ALREADY_BOUGHT })
  mockFetch(async () => json({ code: 'CHECKOUT_OFF' }, 409))
  assert.deepEqual(await startGuideCheckout({ keyword: 'VIDEO', s: 'tok' }), { ok: false, message: SOMETHING_WRONG })
})

test('a 404 on any thank-you action is expired', async () => {
  const expired = { ok: false, message: THANKS_EXPIRED, expired: true }
  mockFetch(async () => json({ code: 'THANKS_LINK_INVALID' }, 404))
  assert.deepEqual(await sendSurvey({ keyword: 'V', s: 't', answers: [] }), expired)
  assert.deepEqual(await joinKitWaitlist({ keyword: 'V', s: 't' }), expired)
  assert.deepEqual(await startGuideCheckout({ keyword: 'V', s: 't' }), expired)
})

test('a network error or 500 on an action is SOMETHING_WRONG; 429 is TOO_MANY', async () => {
  mockFetch(async () => {
    throw new Error('down')
  })
  assert.deepEqual(await joinKitWaitlist({ keyword: 'V', s: 't' }), { ok: false, message: SOMETHING_WRONG })
  mockFetch(async () => json({}, 429))
  assert.deepEqual(await sendSurvey({ keyword: 'V', s: 't', answers: [] }), { ok: false, message: TOO_MANY })
})

test('resendGuideLink: 202 ok, 429 TOO_MANY, path is encoded', async () => {
  mockFetch(async () => json({ ok: true }, 202))
  assert.deepEqual(await resendGuideLink({ purchaseId: 'p/1' }), { ok: true })
  assert.equal(calls[0].url, 'https://api.example.com/v1/public/downloads/p%2F1/resend')
  assert.equal(calls[0].init?.method, 'POST')
  mockFetch(async () => json({}, 429))
  assert.deepEqual(await resendGuideLink({ purchaseId: 'p1' }), { ok: false, message: TOO_MANY })
})

test('the unavailable copy is exported', () => {
  assert.equal(THANKS_UNAVAILABLE, "This page isn't available right now. Try again in a few minutes.")
})

test('cleanAnswers keeps only well-formed question/answer pairs', () => {
  assert.deepEqual(cleanAnswers('x'), [])
  assert.deepEqual(cleanAnswers(null), [])
  assert.deepEqual(
    cleanAnswers([{ question: 'q', answer: 'a' }, { question: 'q' }, null, 3, { question: 1, answer: 'a' }, { question: 'r', answer: 'b', extra: 1 }]),
    [
      { question: 'q', answer: 'a' },
      { question: 'r', answer: 'b' },
    ]
  )
})

test('unansweredQuestions lists the questions not yet answered', () => {
  assert.deepEqual(unansweredQuestions([]), [])
  assert.deepEqual(
    unansweredQuestions([
      { question: 'a', answered: true },
      { question: 'b', answered: false },
    ]),
    ['b']
  )
})
