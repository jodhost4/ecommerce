import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiSearch, FiCheck, FiClock, FiTruck, FiMapPin, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STEP_ICONS = {
  PENDING: FiClock,
  CONFIRMED: FiCheck,
  PROCESSING: FiPackage,
  SHIPPED: FiTruck,
  DELIVERED: FiMapPin,
};

const STATUS_COLORS = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400', line: 'bg-yellow-300' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', line: 'bg-blue-300' },
  PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', line: 'bg-indigo-300' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500', line: 'bg-purple-300' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', line: 'bg-green-300' },
};

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/stores/default/orders/${orderNumber.trim()}`);
      setOrder(res.data.data);
    } catch {
      setOrder(null);
      toast.error('Order not found. Please check your order number.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your order number to track its status</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter order number (e.g. ORD-12345)"
            className="input-field pl-12 text-lg"
          />
        </div>
        <button type="submit" disabled={loading || !orderNumber.trim()} className="btn-primary px-8 disabled:opacity-50">
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {loading && <LoadingSpinner />}

      {!loading && searched && !order && (
        <div className="text-center py-16">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-500 mb-4">We couldn't find an order with that number. Please check and try again.</p>
          <Link to="/orders" className="btn-secondary">View My Orders</Link>
        </div>
      )}

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[order.status]?.text || 'text-gray-800'}`}>
                {order.status}
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-8 relative">
                {STATUS_STEPS.map((step, i) => {
                  const StepIcon = STEP_ICONS[step];
                  const isCompleted = i < currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const isUpcoming = i > currentStepIndex;

                  return (
                    <div key={step} className="flex items-start gap-4 relative">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                          isCompleted ? 'bg-green-500 text-white' : isCurrent ? `${STATUS_COLORS[step].bg} ${STATUS_COLORS[step].text} border-2 ${STATUS_COLORS[step].dot.replace('bg-', 'border-')}` : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? <FiCheck className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <div className="pt-1.5">
                        <p className={`font-semibold ${isCompleted ? 'text-green-600' : isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.charAt(0) + step.slice(1).toLowerCase()}
                        </p>
                        <p className={`text-sm mt-0.5 ${isCompleted ? 'text-green-600' : isCurrent ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                          {isCompleted && 'Completed'}
                          {isCurrent && 'Current'}
                          {isUpcoming && 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiShoppingBag className="w-4 h-4" /> Order Items
              </h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image || 'https://placehold.co/100'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr className="border-gray-200 my-4" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost?.toFixed(2)}`}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.shipments?.length > 0 && (
              <div className="p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTruck className="w-4 h-4" /> Tracking Information
                </h3>
                <div className="space-y-4">
                  {order.shipments.map((shipment) => (
                    <div key={shipment.id} className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Carrier</span>
                        <span className="font-medium text-gray-900">{shipment.carrier || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tracking #</span>
                        <span className="font-medium text-gray-900">{shipment.trackingNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[shipment.status]?.bg || 'bg-gray-100'} ${STATUS_COLORS[shipment.status]?.text || 'text-gray-800'}`}>
                          {shipment.status}
                        </span>
                      </div>
                      {shipment.estimatedDelivery && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Est. Delivery</span>
                          <span className="font-medium text-gray-900">{new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                        </div>
                      )}
                      {shipment.trackingUrl && (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary w-full mt-2 text-center text-sm"
                        >
                          Track Package
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.shippingAddress && (
              <div className="p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" /> Shipping Address
                </h3>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-medium text-gray-800">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
