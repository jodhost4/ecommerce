import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiChevronLeft, FiMapPin, FiCreditCard, FiTruck } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_BADGE = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
  PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Processing' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
};

const PAYMENT_BADGE = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  PAID: { bg: 'bg-green-100', text: 'text-green-800' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800' },
  REFUNDED: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

export default function OrderDetail() {
  const { storeId: urlStoreId, orderNumber } = useParams();
  const storeId = urlStoreId || 'default';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/stores/${storeId}/orders/${orderNumber}`).then((res) => {
      setOrder(res.data.data);
    }).catch(() => {
      setOrder(null);
    }).finally(() => setLoading(false));
  }, [storeId, orderNumber]);

  if (loading) return <LoadingSpinner />;
  if (!order) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
      <Link to={`/store/${storeId}/orders`} className="btn-primary mt-4 inline-block">Back to Orders</Link>
    </div>
  );

  const status = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING;
  const payment = PAYMENT_BADGE[order.paymentStatus] || PAYMENT_BADGE.PENDING;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/store/${storeId}/orders`} className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-6">
        <FiChevronLeft className="mr-1" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>{status.label}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.bg} ${payment.text}`}>{order.paymentStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-xl border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPackage className="w-5 h-5" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image || 'https://placehold.co/100'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.shipments?.length > 0 && (
            <div className="p-6 rounded-xl border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTruck className="w-5 h-5" /> Tracking
              </h2>
              {order.shipments.map((shipment) => (
                <div key={shipment.id} className="text-sm text-gray-600">
                  <p>Carrier: {shipment.carrier}</p>
                  <p>Tracking: {shipment.trackingNumber}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[shipment.status]?.bg || 'bg-gray-100'} ${STATUS_BADGE[shipment.status]?.text || 'text-gray-800'}`}>
                    {shipment.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {order.notes && (
            <div className="p-6 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
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

          {order.shippingAddress && (
            <div className="p-6 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FiMapPin className="w-4 h-4" /> Shipping Address
              </h3>
              <p className="text-sm text-gray-600">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="text-sm text-gray-600">{order.shippingAddress.addressLine2}</p>}
              <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            </div>
          )}

          {order.payments?.length > 0 && (
            <div className="p-6 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FiCreditCard className="w-4 h-4" /> Payment
              </h3>
              {order.payments.map((payment) => (
                <div key={payment.id} className="text-sm text-gray-600">
                  <p>{payment.method} - {payment.status}</p>
                  <p className="font-medium text-gray-900">${payment.amount?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
