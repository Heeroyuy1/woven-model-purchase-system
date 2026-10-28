/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Fallback publishable key. In normal operation the key is served by
   * GET /api/checkout/config so the frontend never has to be rebuilt when
   * switching between Stripe test and live mode.
   */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
