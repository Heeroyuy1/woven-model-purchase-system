import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CreditCard, Wallet, ShoppingBag, Tag, Loader2, MapPin, User, Mail, Phone, Building2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import * as licensingApi from '../services/licensingApi';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'India', 'Other',
];

const STEPS = [
  { id: 1, label: 'Customer Info' },
  { id: 2, label: 'Billing Address' },
  { id: 3, label: 'Payment' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { items, fetchCart, removeItem, subtotal, loading: cartLoading } = useCartStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

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

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, []);

  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      navigate('/cart');
    }
  }, [items, cartLoading]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBillingAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const res: any = await licensingApi.validateCoupon(couponCode.trim());
      if (res.discountPercent) {
        setDiscount(res.discountPercent);
        toast.success(`Coupon applied! ${res.discountPercent}% off`);
      } else if (res.discountAmount) {
        setDiscount(res.discountAmount);
        toast.success(`Coupon applied! $${res.discountAmount} off`);
      } else {
        setDiscount(0);
        toast.success('Coupon applied!');
      }
    } catch (err: any) {
      setCouponError(err?.message || 'Invalid coupon');
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const calcSubtotal = () => subtotal();
  const calcDiscount = () => {
    if (discount > 0) {
      return (calcSubtotal() * discount) / 100;
    }
    return 0;
  };
  const calcTax = () => (calcSubtotal() - calcDiscount()) * 0.08;
  const calcTotal = () => calcSubtotal() - calcDiscount() + calcTax();

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        paymentMethod,
        paymentToken: 'tok_visa',
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        billingAddress: {
          line1: billingAddress.addressLine1,
          city: billingAddress.city,
          state: billingAddress.state,
          postalCode: billingAddress.zip,
          country: billingAddress.country,
        },
        couponCode: couponCode || undefined,
      };
      const result: any = await licensingApi.placeOrder(orderData);
      toast.success('Order placed successfully!');
      navigate(`/order/${result.order?.id || result.order?.orderNumber || 'confirmation'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep = () => {
    if (step === 1) {
      return customerInfo.firstName && customerInfo.lastName && customerInfo.email;
    }
    if (step === 2) {
      return billingAddress.addressLine1 && billingAddress.city && billingAddress.state && billingAddress.zip;
    }
    return true;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Steps */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-2 ${step >= s.id ? 'text-cyan-400' : 'text-gray-500'}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Company <span className="text-gray-500">(optional)</span></label>
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
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone <span className="text-gray-500">(optional)</span></label>
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
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
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
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep()}
                    className="btn-primary-gradient px-6 py-3 rounded-xl font-semibold text-navy-950 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
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
                  <h2 className="text-xl font-bold text-white">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: paymentMethod === 'stripe' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255,255,255,0.1)',
                      backgroundColor: paymentMethod === 'stripe' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">Credit Card (Stripe)</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200"
                    style={{
                      borderColor: paymentMethod === 'paypal' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255,255,255,0.1)',
                      backgroundColor: paymentMethod === 'paypal' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    <Wallet className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">PayPal</span>
                  </label>
                </div>

                {paymentMethod === 'stripe' && (
                  <div className="p-4 rounded-xl bg-navy-800/60 border border-white/10">
                    <p className="text-sm text-gray-400 mb-3">Card Details</p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="input-dark w-full"
                        disabled
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="MM/YY" className="input-dark w-full" disabled />
                        <input type="text" placeholder="CVC" className="input-dark w-full" disabled />
                      </div>
                      <p className="text-xs text-gray-500">This is a placeholder — Stripe Elements integration will be added.</p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-4 rounded-xl bg-navy-800/60 border border-white/10">
                    <p className="text-sm text-gray-400">You will be redirected to PayPal to complete your purchase.</p>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white border border-white/10 hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary-gradient px-8 py-3 rounded-xl font-semibold text-navy-950 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {loading ? 'Processing...' : `Pay $${calcTotal().toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Order Summary</h3>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((item: any) => {
                const name = item.productName || item.product?.name || 'Product';
                const price = item.unitPrice || item.product?.price || 0;
                return (
                  <div key={item.id || item._id || item.productId} className="flex items-start gap-3 pb-3 border-b border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-white font-medium">${(price * item.quantity).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            {/* Coupon */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                    placeholder="Coupon code"
                    className="input-dark pl-10 w-full text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                >
                  {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
              {discount > 0 && <p className="text-green-400 text-xs mt-1">Coupon applied! {discount}% off</p>}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${calcSubtotal().toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount ({discount}%)</span>
                  <span>-${calcDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>Tax (8%)</span>
                <span>${calcTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10">
                <span>Total</span>
                <span>${calcTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
