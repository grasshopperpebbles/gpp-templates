// Stripe for the Tauri app (added by `gpp add stripe`). A desktop app ships to users, so it holds
// only the publishable key, never a secret key. Create Checkout Sessions on your API (with its
// secret key) and open the returned https URL in the system browser.
export const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
