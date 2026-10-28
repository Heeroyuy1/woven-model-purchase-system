import { FormEvent, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Lock, Loader2 } from 'lucide-react';
import { getStripe } from '@/lib/stripe';

export interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  amountLabel: string;
  returnUrl: string;
  onPaid: (paymentIntentId: string, status: string) => void;
  onError: (message: string) => void;
}

/** Appearance tuned to the storefront's navy/cyan design system. */
const ELEMENTS_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#06b6d4',
    colorBackground: '#0b1220',
    colorText: '#e5e7eb',
    colorTextSecondary: '#9ca3af',
    colorDanger: '#f87171',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
};

interface InnerFormProps {
  amountLabel: string;
  returnUrl: string;
  onPaid: (paymentIntentId: string, status: string) => void;
  onError: (message: string) => void;
}

function InnerPaymentForm({ amountLabel, returnUrl, onPaid, onError }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Only leave the page when the card actually needs a redirect (3DS).
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? 'Your card could not be charged. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent) {
      onPaid(paymentIntent.id, paymentIntent.status);
      return;
    }

    onError('Stripe did not return a payment result. Please check your orders before retrying.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="btn-primary-gradient w-full px-8 py-3 rounded-xl font-semibold text-navy-950 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
        {submitting ? 'Processing payment...' : `Pay ${amountLabel}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Payments are processed by Stripe. Card details never touch our servers.
      </p>
    </form>
  );
}

export default function StripePaymentForm({
  clientSecret,
  publishableKey,
  amountLabel,
  returnUrl,
  onPaid,
  onError,
}: StripePaymentFormProps) {
  const stripePromise = useMemo(() => getStripe(publishableKey), [publishableKey]);

  const elementsOptions = useMemo(
    () => ({ clientSecret, appearance: ELEMENTS_APPEARANCE }),
    [clientSecret]
  );

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <InnerPaymentForm
        amountLabel={amountLabel}
        returnUrl={returnUrl}
        onPaid={onPaid}
        onError={onError}
      />
    </Elements>
  );
}
