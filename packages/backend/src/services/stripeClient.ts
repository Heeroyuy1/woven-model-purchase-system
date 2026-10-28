import Stripe from 'stripe';
import { env } from '../config/env';

export type StripeMode = 'live' | 'test' | 'unconfigured';

let cachedClient: Stripe | null = null;
let cachedKey: string | null = null;

/**
 * Derives the operating mode from the configured secret key.
 * Live and test keys are mutually exclusive, so the key prefix is the
 * single source of truth for which mode the backend is running in.
 */
export function getStripeMode(): StripeMode {
  const key = env.STRIPE_SECRET_KEY;

  if (!key) {
    return 'unconfigured';
  }

  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) {
    return 'live';
  }

  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) {
    return 'test';
  }

  // An unrecognised prefix is almost certainly a copy/paste error.
  throw new Error(
    'STRIPE_SECRET_KEY is set but does not look like a Stripe secret key (expected sk_test_... or sk_live_...).'
  );
}

export function isStripeConfigured(): boolean {
  return getStripeMode() !== 'unconfigured';
}

export function isLiveMode(): boolean {
  return getStripeMode() === 'live';
}

/**
 * Lazily constructs (and reuses) the Stripe client.
 * Throws if no key is configured so we never silently fall back to a
 * simulated payment.
 */
export function getStripeClient(): Stripe {
  const secretKey = env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe is not configured: set STRIPE_SECRET_KEY.');
  }

  // Rebuild only if the key changed (e.g. a hot reload between modes).
  if (cachedClient && cachedKey === secretKey) {
    return cachedClient;
  }

  cachedClient = new Stripe(secretKey, {
    maxNetworkRetries: 2,
    timeout: 20000,
    appInfo: { name: 'Woven Model Purchase System', version: '1.0.0' },
  });
  cachedKey = secretKey;

  return cachedClient;
}

/**
 * The publishable key must belong to the same mode as the secret key,
 * otherwise Stripe.js will refuse to confirm the PaymentIntent.
 */
export function assertPublishableKeyMatchesMode(): void {
  const mode = getStripeMode();
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY;

  if (mode === 'unconfigured' || !publishableKey) {
    return;
  }

  const publishableIsLive = publishableKey.startsWith('pk_live_');

  if (mode === 'live' && !publishableIsLive) {
    throw new Error(
      'STRIPE_PUBLISHABLE_KEY is a test key but STRIPE_SECRET_KEY is a live key. Both must be from the same mode.'
    );
  }

  if (mode === 'test' && publishableIsLive) {
    throw new Error(
      'STRIPE_PUBLISHABLE_KEY is a live key but STRIPE_SECRET_KEY is a test key. Both must be from the same mode.'
    );
  }
}
