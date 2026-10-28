import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Globe,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Tag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as licensingApi from '../services/licensingApi';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import StripePaymentForm from '../components/checkout/StripePaymentForm';
import { resolvePublishableKey } from '../lib/stripe';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'India', 'Other',
];

const STEPS = [
  { id: 1, label: 'Customer Info' },
  { id: 2, label: 'Billing Address' },
  { id: 3, label: 'Payment' },
];

interface CheckoutLine {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CheckoutTotals {
  items: CheckoutLine[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  currency: string;
  couponCode: string | null;
  taxRate: number;
}

interface PaymentSession {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  publishableKey: string;
  totals: CheckoutTotals;
}

const money = (value: number | undefined) => `$${(value ?? 0).toFixed(2)}`;
export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { items, fetchCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [totalsError, setTotalsError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    company: user?.company || '',
    phone: user?.phone || '',
  });

  const [billingAddress, setBillingAddress] = useState({
    addressLine1: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  const [session, setSession] = useState<PaymentSession | null>(null);
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Captured once so the 3DS return trip does not bounce the customer to /cart.
  const returningFromPayment = useRef(Boolean(searchParams.get('payment_intent')));

  const finalizePayment = useCallback(
    async (paymentIntentId: string) => {
      setFinalizing(true);
      setPaymentError('');

      try {
        const result = (await licensingApi.placeOrder({ paymentIntentId })) as any;

        if (result?.pending) {
          setPaymentError(
            'Your payment is being finalised. Refresh this page in a moment to see your order.'
          );
          return;
        }

        await fetchCart();
        toast.success('Payment received - your license keys are on the way.');

        const orderId = result?.order?.id;
        navigate(orderId ? `/order/${orderId}` : '/portal/orders', { replace: true });
      } catch (error: any) {
        setPaymentError(
          error?.message ??
            'We could not confirm your payment. Do not retry - contact support with your order reference.'
        );
      } finally {
        setFinalizing(false);
      }
    },
    [fetchCart, navigate]
  );

  // Handle the return leg of a 3DS/SCA redirect.
  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    if (!paymentIntentId) return;

    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus && redirectStatus !== 'succeeded') {
      toast.error('Your payment was not completed and you have not been charged.');
      navigate('/checkout', { replace: true });
      return;
    }

    void finalizePayment(paymentIntentId);
    // Only runs for the redirect that landed us on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated, fetchCart, navigate]);
const loadTotals = useCallback(async (coupon?: string) => {
    try {
      const data = (await licensingApi.calculateCheckout({
        couponCode: coupon || undefined,
      })) as CheckoutTotals;
      setTotals(data);
      setTotalsError('');
    } catch (error: any) {
      setTotalsError(error?.message ?? 'Could not price your cart.');
    }
  }, []);

  useEffect(() => {
    if (returningFromPayment.current) return;

    if (items.length === 0) {
      if (!totals) navigate('/cart');
      return;
    }

    void loadTotals(appliedCoupon || undefined);
    // Re-price only when the cart contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleCustomerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleAddressChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBillingAddress((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponError('');

    try {
      const data = (await licensingApi.calculateCheckout({ couponCode: code })) as CheckoutTotals;
      setTotals(data);
      setAppliedCoupon(code);
      // A new price invalidates any open payment intent.
      setSession(null);
      if (step === 3) setStep(2);
      toast.success(
        data.discount > 0 ? `Coupon applied - ${money(data.discount)} off` : 'Coupon applied'
      );
    } catch (error: any) {
      setCouponError(error?.message ?? 'Invalid coupon');
      toast.error(error?.message ?? 'Invalid coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const startPayment = async () => {
    setPreparingPayment(true);
    setPaymentError('');

    try {
      const data = (await licensingApi.createPaymentIntent({
        couponCode: appliedCoupon || undefined,
        billingAddress: {
          line1: billingAddress.addressLine1,
          city: billingAddress.city,
          state: billingAddress.state || undefined,
          postalCode: billingAddress.zip || undefined,
          country: billingAddress.country,
        },
      })) as any;

      const publishableKey = resolvePublishableKey(data.publishableKey);

      if (!publishableKey) {
        throw new Error(
          'Card payments are not configured. Please contact support and we will complete your order manually.'
        );
      }

      setTotals(data.totals as CheckoutTotals);
      setSession({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        orderId: data.orderId,
        publishableKey,
        totals: data.totals as CheckoutTotals,
      });
      setStep(3);
    } catch (error: any) {
      const message = error?.message ?? 'Could not start the payment.';
      setPaymentError(message);
      toast.error(message);
    } finally {
      setPreparingPayment(false);
    }
  };

  const handlePaid = async (paymentIntentId: string, status: string) => {
    if (status === 'succeeded') {
      await finalizePayment(paymentIntentId);
      return;
    }

    setPaymentError(
      status === 'processing'
        ? 'Your bank is still processing this payment. We will email your license keys as soon as Stripe confirms it.'
        : `Payment status: ${status}. You have not been charged.`
    );
  };

  const canProceedStep = () => {
    if (step === 1) {
      return Boolean(customerInfo.firstName && customerInfo.lastName && customerInfo.email);
    }
    if (step === 2) {
      return Boolean(
        billingAddress.addressLine1 &&
          billingAddress.city &&
          billingAddress.state &&
          billingAddress.zip
      );
    }
    return true;
  };

  const returnUrl = `${window.location.origin}/checkout`;
  const displayTotals = session?.totals ?? totals;
return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 ${step >= s.id ? 'text-cyan-400' : 'text-gray-500'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step > s.id
                    ? 'bg-cyan-500 text-navy-950'
                    : step === s.id
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                    : 'bg-navy-800 border border-white/10 text-gray-500'
                }`}
              >
                {step > s.id ? '✓' : s.id}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-16 sm:w-24 h-px mx-2 ${step > s.id ? 'bg-cyan-500' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {paymentError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{paymentError}</p>
        </div>
      )}

      {finalizing && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <p className="text-sm text-cyan-100">
            Confirming your payment with Stripe and issuing your licenses...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {/* Step 1 - Customer Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Customer Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerInfo.firstName}
                      onChange={handleCustomerChange}
                      className="input-dark w-full"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerInfo.lastName}
                      onChange={handleCustomerChange}
                      className="input-dark w-full"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleCustomerChange}
                    className="input-dark w-full"
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your receipt and license keys are sent to this address.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Company <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={customerInfo.company}
                      onChange={handleCustomerChange}
                      className="input-dark w-full"
                      placeholder="Your company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Phone <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerChange}
                      className="input-dark w-full"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep()}
                    className="btn-primary-gradient px-6 py-3 rounded-xl font-semibold text-navy-950 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 - Billing Address */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Billing Address</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Address Line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={billingAddress.addressLine1}
                    onChange={handleAddressChange}
                    className="input-dark w-full"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={billingAddress.city}
                      onChange={handleAddressChange}
                      className="input-dark w-full"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={billingAddress.state}
                      onChange={handleAddressChange}
                      className="input-dark w-full"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">ZIP Code</label>
                    <input
                      type="text"
                      name="zip"
                      value={billingAddress.zip}
                      onChange={handleAddressChange}
                      className="input-dark w-full"
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <select
                      name="country"
                      value={billingAddress.country}
                      onChange={handleAddressChange}
                      className="input-dark pl-10 w-full appearance-none"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={startPayment}
                    disabled={!canProceedStep() || preparingPayment}
                    className="btn-primary-gradient px-6 py-3 rounded-xl font-semibold text-navy-950 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {preparingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {preparingPayment ? 'Preparing...' : 'Continue to Payment'}
                  </button>
                </div>
              </div>
            )}
{/* Step 3 - Payment */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Card Payment</h2>
                </div>

                {session ? (
                  <>
                    <div className="flex items-center gap-2 rounded-xl bg-navy-800/60 border border-white/10 px-4 py-3">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <p className="text-xs text-gray-400">
                        Secured by Stripe. 3-D Secure is handled automatically when your bank
                        requires it.
                      </p>
                    </div>

                    <StripePaymentForm
                      clientSecret={session.clientSecret}
                      publishableKey={session.publishableKey}
                      amountLabel={money(session.totals.total)}
                      returnUrl={returnUrl}
                      onPaid={handlePaid}
                      onError={(message) => setPaymentError(message)}
                    />
                  </>
                ) : (
                  <div className="rounded-xl bg-navy-800/60 border border-white/10 p-4 space-y-3">
                    <p className="text-sm text-gray-300">
                      Your payment session has expired or the cart changed.
                    </p>
                    <button
                      onClick={startPayment}
                      disabled={preparingPayment}
                      className="btn-primary-gradient px-6 py-3 rounded-xl font-semibold text-navy-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {preparingPayment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      {preparingPayment ? 'Preparing...' : 'Restart payment'}
                    </button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={finalizing}
                    className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <p className="text-xs text-gray-500 self-center max-w-xs text-right">
                    Changing your address re-quotes the order and opens a new payment session.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Order Summary</h3>
            </div>

            {totalsError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">{totalsError}</p>
              </div>
            )}

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {(displayTotals?.items ?? []).map((line) => (
                <div
                  key={line.productId}
                  className="flex items-start gap-3 pb-3 border-b border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{line.productName}</p>
                    <p className="text-xs text-gray-400">
                      {line.quantity} × {money(line.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm text-white font-medium whitespace-nowrap">
                    {money(line.totalPrice)}
                  </p>
                </div>
              ))}

              {!displayTotals && !totalsError && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pricing your cart...
                </div>
              )}
            </div>

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(event.target.value);
                      setCouponError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    placeholder="Coupon code"
                    className="input-dark pl-10 w-full text-sm"
                    disabled={applyingCoupon}
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
              {appliedCoupon && !couponError && (
                <p className="text-green-400 text-xs mt-1">Coupon {appliedCoupon} applied</p>
              )}
            </div>

            {/* Totals - all values come from the server */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{money(displayTotals?.subtotal)}</span>
              </div>

              {!!displayTotals?.discount && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-{money(displayTotals.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-400">
                <span>Tax{displayTotals?.taxRate ? ` (${(displayTotals.taxRate * 100).toFixed(2)}%)` : ''}</span>
                <span>{money(displayTotals?.taxAmount)}</span>
              </div>

              <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10">
                <span>Total</span>
                <span>{money(displayTotals?.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
