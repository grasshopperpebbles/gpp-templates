// Stripe checkout for the desktop app (added by `gpp add stripe`).
//
// A desktop app ships to users, so it holds no Stripe secret keys. Your API creates the Checkout
// Session with its secret key; this main-process handler asks the API for the session URL and opens
// it in the system browser. The renderer only calls window.electronAPI.stripe.openCheckout().
//
// The API must expose: POST {API_BASE_URL}/stripe/checkout-session (any base path is kept, e.g.
// API_BASE_URL=http://localhost:8000/api/v1 posts to /api/v1/stripe/checkout-session)
//   request body:  { "priceId": "price_..." }
//   response body: { "url": "https://checkout.stripe.com/..." }
import { ipcMain, shell } from 'electron';
import { CHANNELS } from './channels.js';
import { isAppUrl } from './validate.js';

// Set API_BASE_URL in the environment that launches the app, or change the default for your builds.
const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const CHECKOUT_PATH = '/stripe/checkout-session';
const REQUEST_TIMEOUT_MS = 15_000;
// Hosts whose https URLs may be opened in the system browser. Add a host here only if your API
// returns Checkout links on it (e.g. a custom Stripe Checkout domain).
const CHECKOUT_HOSTS = ['checkout.stripe.com'];
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

export interface CheckoutRequest {
  priceId: string;
}

function apiBaseUrl(): URL {
  const base = new URL(process.env.API_BASE_URL || DEFAULT_API_BASE_URL);
  const local = LOCAL_HOSTS.includes(base.hostname);
  // Plain http only for a local API in development
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && local)) {
    throw new Error('API_BASE_URL must be https (http is allowed only for localhost)');
  }
  return base;
}

function parseRequest(request: unknown): CheckoutRequest {
  const priceId = (request as { priceId?: unknown } | null)?.priceId;
  if (typeof priceId !== 'string' || !/^[A-Za-z0-9_]{1,255}$/.test(priceId)) {
    throw new Error('openCheckout needs a Stripe price id, e.g. { priceId: "price_123" }');
  }
  return { priceId };
}

/** POST {API_BASE_URL}/stripe/checkout-session, keeping any base path such as /api/v1. */
function checkoutEndpoint(): URL {
  const endpoint = apiBaseUrl();
  endpoint.pathname = endpoint.pathname.replace(/\/+$/, '') + CHECKOUT_PATH;
  return endpoint;
}

function checkoutUrl(value: unknown): string {
  try {
    const parsed = new URL(String(value));
    if (parsed.protocol === 'https:' && CHECKOUT_HOSTS.includes(parsed.hostname)) return parsed.href;
  } catch {
    // fall through
  }
  throw new Error(`The API did not return an https checkout URL on ${CHECKOUT_HOSTS.join(', ')}`);
}

export function registerStripeHandlers(devServerUrl: string | undefined): void {
  ipcMain.handle(CHANNELS.stripeOpenCheckout, async (event, request: unknown) => {
    if (!isAppUrl(event.senderFrame?.url, devServerUrl)) throw new Error('Untrusted sender');
    const body = parseRequest(request);

    const response = await fetch(checkoutEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Checkout request failed (${response.status})`);

    const { url } = (await response.json()) as { url?: unknown };
    await shell.openExternal(checkoutUrl(url));
    return { ok: true };
  });
}
