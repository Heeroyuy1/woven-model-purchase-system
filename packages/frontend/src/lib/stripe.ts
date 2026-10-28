import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Stripe.js can only be initialised once per publishable key, so the promise
 * is cached. Switching between test and live keys simply creates a second
 * entry rather than reusing the wrong instance.
 */
const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

export function getStripe(publishableKey: string): Promise<Stripe | null> {
  if (!publishableKey) {
    return Promise.resolve(null);
  }

  const cached = stripePromiseCache.get(publishableKey);
  if (cached) {
    return cached;
  }

  const created = loadStripe(publishableKey);
  stripePromiseCache.set(publishableKey, created);
  return created;
}

/**
 * The backend is the source of truth for which key to use, because it holds
 * the matching secret key. The build-time value is only a fallback for local
 * development against a backend with no key configured.
 */
export function resolvePublishableKey(serverKey: string | null | undefined): string | null {
  if (serverKey) {
    return serverKey;
  }

  const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return envKey ? envKey : null;
}
