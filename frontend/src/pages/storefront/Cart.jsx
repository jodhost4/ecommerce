import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../components/layout/ThemeContext';

export default function Cart() {
  const { storeId: urlStoreId } = useParams();
  const storeId = urlStoreId || 'default';
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get(`/stores/${storeId}/cart`).then((res) => {
      setCart(res.data.data);
    }).catch(() => {
      setCart(null);
    }).finally(() => setLoading(false));
  }, [storeId]);

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdating(itemId);
    try {
      await api.put(`/stores/${storeId}/cart/items/${itemId}`, { quantity: newQty });
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) => item.id === itemId ? { ...item, quantity: newQty } : item),
      }));
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/stores/${storeId}/cart/items/${itemId}`);
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode) {
      setAppliedCoupon({ code: couponCode, discount: 10 });
      toast.success('Coupon applied!');
    }
  };

  const { pageLayouts } = useTheme();
  const cartLayout = pageLayouts?.cart || {};
  const showCoupon = cartLayout.showCoupon !== false;
  const showShipping = cartLayout.showShipping !== false;

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon ? subtotal * 0.1 : 0;
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal - discount + shipping;

  if (loading) return <LoadingSpinner />;

  if (!items.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
        <Link to={`/store/${storeId}/products`} className="btn-primary inline-flex items-center">
          <FiArrowLeft className="mr-2" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 p-4 rounded-xl border border-gray-200"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img src={item.product?.images?.[0]?.url || 'https://placehold.co/200'} alt={item.product?.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/store/${storeId}/products/${item.product?.slug}`} className="font-semibold text-gray-900 hover:text-primary-600">{item.product?.name}</Link>
                {item.variantId && <p className="text-sm text-gray-500 mt-0.5">Variant</p>}
                <p className="text-primary-600 font-bold mt-1">₹{Number(item.price * item.quantity).toFixed(2)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id}
                      className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiPlus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-xl border border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₹{Number(subtotal).toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{Number(discount).toFixed(2)}</span>
                </div>
              )}
              {showShipping && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? 'FREE' : `₹${Number(shipping).toFixed(2)}`}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{Number(total).toFixed(2)}</span>
              </div>
            </div>

            {showCoupon && (
              <div className="mt-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="input-field flex-1"
                  />
                  <button onClick={handleApplyCoupon} className="btn-secondary whitespace-nowrap">Apply</button>
                </div>
              </div>
            )}

            <Link to={`/store/${storeId}/checkout`} className="btn-primary w-full mt-6 py-3 text-base">
              Proceed to Checkout
            </Link>

            <Link to={`/store/${storeId}/products`} className="flex items-center justify-center mt-4 text-sm text-primary-600 hover:text-primary-700">
              <FiArrowLeft className="mr-1" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
