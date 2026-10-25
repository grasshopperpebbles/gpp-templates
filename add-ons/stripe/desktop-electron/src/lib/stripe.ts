// Stripe checkout from the renderer (added by `gpp add stripe`). No keys live here: the main
// process asks your API for a Checkout Session and opens it in the system browser
// (see electron/ipc/stripeHandlers.ts).
export async function openCheckout(priceId: string): Promise<void> {
  const stripe = window.electronAPI?.stripe;
  if (!stripe) {
    throw new Error('Checkout is only available inside the Electron app');
  }
  await stripe.openCheckout({ priceId });
}
