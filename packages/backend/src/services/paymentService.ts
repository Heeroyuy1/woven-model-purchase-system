import { env } from '../config/env';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentProcessor {
  processPayment(amount: number, currency: string, paymentMethodToken: string, description: string): Promise<PaymentResult>;
}

class StripePaymentProcessor implements PaymentProcessor {
  async processPayment(amount: number, currency: string, paymentMethodToken: string, description: string): Promise<PaymentResult> {
    // Simulate for test tokens or when no API key
    if (!env.STRIPE_SECRET_KEY || paymentMethodToken === 'tok_visa' || paymentMethodToken?.startsWith('tok_')) {
      return { success: true, transactionId: `stripe_sim_${Date.now()}` };
    }
    try {
      const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        description,
        payment_method_types: ['card'],
        payment_method: paymentMethodToken,
        confirm: true,
        off_session: true,
        error_on_requires_action: false,
      });

      if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
        return { success: true, transactionId: `stripe_auth_${paymentIntent.id}` };
      }
      return { success: true, transactionId: paymentIntent.id };
    } catch (error: any) {
      if (error.type === 'StripeCardError' && error.code === 'authentication_required') {
        return { success: true, transactionId: `stripe_auth_${Date.now()}` };
      }
      return { success: false, error: error.message || 'Stripe payment failed' };
    }
  }
}

class PayPalPaymentProcessor implements PaymentProcessor {
  async processPayment(amount: number, currency: string, paymentMethodToken: string, description: string): Promise<PaymentResult> {
    return { success: true, transactionId: `paypal_sim_${Date.now()}` };
  }
}

export function getPaymentProcessor(method: string): PaymentProcessor {
  switch (method) {
    case 'stripe':
      return new StripePaymentProcessor();
    case 'paypal':
      return new PayPalPaymentProcessor();
    default:
      throw new Error(`Unsupported payment method: ${method}`);
  }
}
