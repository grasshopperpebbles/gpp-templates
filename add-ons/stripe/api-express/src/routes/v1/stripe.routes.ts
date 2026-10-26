/**
 * Stripe Checkout Sessions (added by `gpp add stripe`).
 *
 * POST /stripe/checkout-session (under /api/v1 in the gpp Express packs)
 *   request body:  { "priceId": "price_...", "successUrl"?: "https://...", "cancelUrl"?: "https://..." }
 *   response body: { "url": "https://checkout.stripe.com/..." }
 *
 * Desktop and mobile apps hold no Stripe secret: they call this endpoint and open the returned
 * URL. Callers choose nothing the server has not allowed:
 *   - priceId must be listed in STRIPE_PRICE_IDS (comma-separated).
 *   - successUrl/cancelUrl default to STRIPE_CHECKOUT_SUCCESS_URL/STRIPE_CHECKOUT_CANCEL_URL. A
 *     caller may pass its own, but only on an origin in STRIPE_CHECKOUT_ALLOWED_ORIGINS
 *     (comma-separated) or the origin of a configured default URL.
 *
 * The endpoint is public, like a "Buy" button on a website. Add your auth middleware to the route
 * if only signed-in users may start a checkout, and fulfil orders from the Stripe webhook
 * (STRIPE_WEBHOOK_SECRET), never from the success page.
 */
import { Router, Request, Response } from 'express';
import { ApiError, asyncHandler } from '../../middleware/error-handler.middleware.js';
import { getStripe } from '../../lib/stripe.js';

const router: Router = Router();

const CHECKOUT_MODES = ['payment', 'subscription'] as const;
type CheckoutMode = (typeof CHECKOUT_MODES)[number];
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const PRICE_ID = /^[A-Za-z0-9_]{1,255}$/;
const MAX_URL_LENGTH = 2048;

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * scheme://host[:port] of an absolute http(s) URL, or undefined if the URL is not one. https is
 * required except on this machine (localhost); URLs with credentials, backslashes or whitespace
 * are refused.
 */
export function urlOrigin(value: string | undefined): string | undefined {
  if (!value || value.length > MAX_URL_LENGTH || /[\\\s\u0000-\u001f]/.test(value)) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
  if (url.username || url.password) return undefined;
  if (url.protocol === 'http:' && !LOOPBACK_HOSTS.has(url.hostname)) return undefined;
  return url.origin;
}

function checkoutConfig() {
  const successUrl = process.env.STRIPE_CHECKOUT_SUCCESS_URL?.trim() ?? '';
  const cancelUrl = process.env.STRIPE_CHECKOUT_CANCEL_URL?.trim() ?? '';
  const origins = new Set<string>();
  for (const value of [...splitList(process.env.STRIPE_CHECKOUT_ALLOWED_ORIGINS), successUrl, cancelUrl]) {
    const origin = urlOrigin(value);
    if (origin) origins.add(origin);
  }
  return {
    secretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? '',
    mode: (process.env.STRIPE_CHECKOUT_MODE?.trim().toLowerCase() || 'payment') as CheckoutMode,
    priceIds: splitList(process.env.STRIPE_PRICE_IDS),
    successUrl,
    cancelUrl,
    origins,
  };
}

function notConfigured(what: string): ApiError {
  console.error(`Stripe checkout is not configured: ${what}`);
  return new ApiError(503, 'Checkout is not configured');
}

function redirectUrl(
  requested: unknown,
  fallback: string,
  name: 'success' | 'cancel',
  origins: Set<string>
): string {
  if (requested === undefined || requested === null) {
    if (!urlOrigin(fallback)) {
      throw notConfigured(`STRIPE_CHECKOUT_${name.toUpperCase()}_URL is unset or not an https URL`);
    }
    return fallback;
  }
  const origin = typeof requested === 'string' ? urlOrigin(requested) : undefined;
  if (!origin || !origins.has(origin)) {
    throw new ApiError(400, `${name}Url is not on an allowed origin`);
  }
  // Pass the caller's string, not URL.href: href would encode Stripe's {CHECKOUT_SESSION_ID}
  return requested as string;
}

/**
 * POST /stripe/checkout-session
 * Creates a Checkout Session for an allowed price and returns its URL.
 */
router.post('/checkout-session', asyncHandler(async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as { priceId?: unknown; successUrl?: unknown; cancelUrl?: unknown };
  const config = checkoutConfig();

  if (!config.secretKey) throw notConfigured('STRIPE_SECRET_KEY is unset');
  if (!CHECKOUT_MODES.includes(config.mode)) {
    throw notConfigured('STRIPE_CHECKOUT_MODE must be payment or subscription');
  }
  if (config.priceIds.length === 0) throw notConfigured('STRIPE_PRICE_IDS is empty');

  if (typeof body.priceId !== 'string' || !PRICE_ID.test(body.priceId)) {
    throw new ApiError(400, 'priceId must be a Stripe price id, e.g. "price_123"');
  }
  if (!config.priceIds.includes(body.priceId)) {
    throw new ApiError(400, 'Unknown price');
  }
  const successUrl = redirectUrl(body.successUrl, config.successUrl, 'success', config.origins);
  const cancelUrl = redirectUrl(body.cancelUrl, config.cancelUrl, 'cancel', config.origins);

  let url: string | null;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    url = session.url;
  } catch (error) {
    // Logged here; the client gets a generic message, not Stripe's
    console.error('Stripe rejected the Checkout Session:', error);
    throw new ApiError(502, 'Could not create the Checkout Session');
  }
  if (!url) throw new ApiError(502, 'Stripe returned no Checkout URL');

  res.json({ url });
}));

export default router;
