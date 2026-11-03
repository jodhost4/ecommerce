import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiChevronLeft, FiChevronRight, FiCreditCard, FiTruck, FiMapPin, FiSmartphone, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../components/layout/ThemeContext';

const STEPS = ['Shipping', 'Shipping Method', 'Payment', 'Review'];

const PAYMENT_METHOD_CONFIG = {
  cod: { label: 'Cash on Delivery', desc: 'Pay with cash when the order is delivered', icon: FiDollarSign },
  upi: { label: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm, BHIM UPI', icon: FiSmartphone },
  card: { label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: FiCreditCard },
  netbanking: { label: 'Net Banking', desc: 'All major Indian banks', icon: FiCreditCard },
  wallet: { label: 'Wallet', desc: 'Paytm, MobiKwik, Amazon Pay', icon: FiSmartphone },
  emi: { label: 'EMI / No-Cost EMI', desc: 'Monthly instalment options', icon: FiCreditCard },
};

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { storeId: urlStoreId } = useParams();
  const storeId = urlStoreId || 'default';

  const { pageLayouts, paymentMethods: storePaymentMethods, colors } = useTheme();
  const checkoutLayout = pageLayouts?.checkout || {};
  const showNotes = checkoutLayout.showNotes !== false;
  const enabledPaymentMethods = storePaymentMethods?.length > 0 ? storePaymentMethods : ['cod'];

  const [form, setForm] = useState({
    shippingAddressId: '',
    billingAddressId: '',
    shippingMethodId: '',
    notes: '',
    couponCode: '',
    paymentMethod: enabledPaymentMethods[0] || 'cod',
  });

  const [newAddress, setNewAddress] = useState({
    label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: 'IN', isDefault: false,
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/stores/${storeId}/cart`),
      api.get(`/stores/${storeId}/addresses`),
    ]).then(([cartRes, addrRes]) => {
      setCart(cartRes.data.data);
      setAddresses(addrRes.data.data);
      if (addrRes.data.data.length > 0) {
        const def = addrRes.data.data.find((a) => a.isDefault) || addrRes.data.data[0];
        setForm((prev) => ({ ...prev, shippingAddressId: def.id, billingAddressId: def.id }));
      }
    }).catch(() => {
      toast.error('Failed to load checkout data');
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        label: newAddress.label || 'Home',
        firstName: newAddress.fullName?.split(' ')[0] || '',
        lastName: newAddress.fullName?.split(' ').slice(1).join(' ') || '',
        phone: newAddress.phone,
        address1: newAddress.addressLine1,
        address2: newAddress.addressLine2 || '',
        city: newAddress.city,
        state: newAddress.state,
        country: newAddress.country || 'IN',
        zipCode: newAddress.postalCode,
        isDefault: newAddress.isDefault,
      };
      const res = await api.post(`/stores/${storeId}/addresses`, payload);
      setAddresses((prev) => [...prev, res.data.data]);
      setForm((prev) => ({ ...prev, shippingAddressId: res.data.data.id, billingAddressId: res.data.data.id }));
      setShowAddressForm(false);
      toast.success('Address added');
    } catch {
      toast.error('Failed to add address');
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        shippingAddressId: form.shippingAddressId,
        billingAddressId: form.billingAddressId,
        shippingMethodId: form.shippingMethodId || null,
        notes: form.notes,
        couponCode: form.couponCode || null,
        paymentMethod: form.paymentMethod,
      };
      const res = await api.post(`/stores/${storeId}/orders`, payload);
      toast.success('Order placed successfully!');
      navigate(`/store/${storeId}/orders/${res.data.data.orderNumber}`);
    } catch {
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!form.shippingAddressId;
    if (step === 1) return true;
    if (step === 2) return true;
    return true;
  };

  const primaryColor = colors?.primary || '#6366f1';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 ${i <= step ? '' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < step ? 'text-white' : i === step ? 'border-2' : 'bg-gray-100 text-gray-400'
              }`} style={i < step ? { backgroundColor: primaryColor } : i === step ? { borderColor: primaryColor, color: primaryColor, backgroundColor: primaryColor + '15' } : {}}>
                {i < step ? <FiCheck className="w-4 h-4" /> : i + 1}
              </div>
              <span className="hidden sm:inline text-sm font-medium" style={{ color: i <= step ? primaryColor : '#9ca3af' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-12 h-0.5 mx-2" style={{ backgroundColor: i < step ? primaryColor : '#e5e7eb' }} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {step === 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
                  {addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <label key={addr.id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors`}
                          style={{ borderColor: form.shippingAddressId === addr.id ? primaryColor : '#e5e7eb', backgroundColor: form.shippingAddressId === addr.id ? primaryColor + '0a' : 'transparent' }}>
                          <input
                            type="radio"
                            name="shippingAddress"
                            value={addr.id}
                            checked={form.shippingAddressId === addr.id}
                            onChange={(e) => setForm((prev) => ({ ...prev, shippingAddressId: e.target.value }))}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-3">
                            <FiMapPin className="w-5 h-5 mt-0.5" style={{ color: form.shippingAddressId === addr.id ? primaryColor : '#9ca3af' }} />
                            <div>
                              <p className="font-medium text-gray-900">{addr.label || 'Address'}</p>
                              <p className="text-sm text-gray-500">{addr.address1 || addr.addressLine1}</p>
                              {(addr.address2 || addr.addressLine2) && <p className="text-sm text-gray-500">{addr.address2 || addr.addressLine2}</p>}
                              <p className="text-sm text-gray-500">{addr.city}, {addr.state} {addr.zipCode || addr.postalCode}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">No addresses saved. Please add one.</p>
                  )}
                  <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn-secondary mt-4">
                    {showAddressForm ? 'Cancel' : '+ Add New Address'}
                  </button>

                  {showAddressForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleCreateAddress}
                      className="mt-4 p-4 rounded-xl border border-gray-200 space-y-3"
                    >
                      <input type="text" placeholder="Label (Home, Office)" value={newAddress.label} onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))} className="input-field" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress((prev) => ({ ...prev, fullName: e.target.value }))} className="input-field" required />
                        <input type="tel" placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))} className="input-field" required />
                      </div>
                      <input type="text" placeholder="Address Line 1" value={newAddress.addressLine1} onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine1: e.target.value }))} className="input-field" required />
                      <input type="text" placeholder="Address Line 2 (optional)" value={newAddress.addressLine2} onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine2: e.target.value }))} className="input-field" />
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))} className="input-field" required />
                        <input type="text" placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))} className="input-field" required />
                        <input type="text" placeholder="PIN Code" value={newAddress.postalCode} onChange={(e) => setNewAddress((prev) => ({ ...prev, postalCode: e.target.value }))} className="input-field" required />
                      </div>
                      <button type="submit" className="btn-primary">Save Address</button>
                    </motion.form>
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: 'standard', name: 'Standard Delivery', price: 49, days: '5–7 business days' },
                      { id: 'express', name: 'Express Delivery', price: 99, days: '2–3 business days' },
                      { id: 'free', name: 'Free Shipping', price: 0, days: '7–12 business days', min: '₹500+' },
                    ].map((method) => (
                      <label key={method.id} className="block p-4 rounded-xl border-2 cursor-pointer transition-colors"
                        style={{ borderColor: form.shippingMethodId === method.id ? primaryColor : '#e5e7eb', backgroundColor: form.shippingMethodId === method.id ? primaryColor + '0a' : 'transparent' }}>
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={method.id}
                          checked={form.shippingMethodId === method.id}
                          onChange={(e) => setForm((prev) => ({ ...prev, shippingMethodId: e.target.value }))}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FiTruck className="w-5 h-5" style={{ color: form.shippingMethodId === method.id ? primaryColor : '#9ca3af' }} />
                            <div>
                              <p className="font-medium text-gray-900">{method.name}</p>
                              <p className="text-sm text-gray-500">{method.days}{method.min ? ` (min. order ${method.min})` : ''}</p>
                            </div>
                          </div>
                          <span className="font-medium">{method.price === 0 ? 'FREE' : `₹${method.price}`}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {enabledPaymentMethods.map((methodId) => {
                      const config = PAYMENT_METHOD_CONFIG[methodId] || { label: methodId, desc: '', icon: FiCreditCard };
                      const Icon = config.icon;
                      return (
                        <label key={methodId} className="block p-4 rounded-xl border-2 cursor-pointer transition-colors"
                          style={{ borderColor: form.paymentMethod === methodId ? primaryColor : '#e5e7eb', backgroundColor: form.paymentMethod === methodId ? primaryColor + '0a' : 'transparent' }}>
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={methodId}
                            checked={form.paymentMethod === methodId}
                            onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" style={{ color: form.paymentMethod === methodId ? primaryColor : '#9ca3af' }} />
                            <div>
                              <p className="font-medium text-gray-900">{config.label}</p>
                              <p className="text-xs text-gray-500">{config.desc}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {form.paymentMethod === 'card' && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-200 space-y-3">
                      <input type="text" placeholder="Card Number" className="input-field" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="MM/YY" className="input-field" />
                        <input type="text" placeholder="CVV" className="input-field" />
                      </div>
                      <input type="text" placeholder="Cardholder Name" className="input-field" />
                    </div>
                  )}
                  {form.paymentMethod === 'upi' && (
                    <div className="mt-4 p-4 rounded-xl border border-gray-200 space-y-3">
                      <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" className="input-field" />
                    </div>
                  )}
                  {showNotes && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">Order Notes (optional)</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className="input-field"
                        rows={3}
                        placeholder="Special instructions for delivery"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Order</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Shipping To</h3>
                      {addresses.find((a) => a.id === form.shippingAddressId) && (
                        <p className="text-sm text-gray-600">
                          {addresses.find((a) => a.id === form.shippingAddressId).address1 || addresses.find((a) => a.id === form.shippingAddressId).addressLine1},{' '}
                          {addresses.find((a) => a.id === form.shippingAddressId).city}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-1">Payment</h3>
                      <p className="text-sm text-gray-600">{PAYMENT_METHOD_CONFIG[form.paymentMethod]?.label || form.paymentMethod}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Items ({items.length})</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.product?.name} × {item.quantity}</span>
                            <span className="font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-50"
            >
              <FiChevronLeft className="mr-1" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Continue <FiChevronRight className="ml-1" />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="btn-primary py-3 px-8 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? 'Placing Order...' : `Place Order — ₹${total.toFixed(2)}`}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-xl border border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.product?.images?.[0]?.url || 'https://placehold.co/100'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.product?.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr className="border-gray-200 mb-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

