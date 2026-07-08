import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiClock, FiPackage, FiTruck, FiCreditCard, FiMapPin, FiUser, FiPrinter, FiSend, FiX } from 'react-icons/fi';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  RETURNED: 'bg-orange-100 text-orange-800 border-orange-200',
  REFUNDED: 'bg-pink-100 text-pink-800 border-pink-200',
};

const paymentStatusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-pink-100 text-pink-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus, note: statusNote });
      toast.success('Status updated');
      setStatusModal(false);
      setStatusNote('');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled');
      setCancelModal(false);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!order) return <p className="text-center text-secondary-500 py-12">Order not found</p>;

  const statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStep = statusFlow.indexOf(order.status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/merchant/orders" className="p-2 hover:bg-secondary-100 rounded-lg"><FiArrowLeft className="w-5 h-5 text-secondary-600" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{order.orderNumber}</h1>
            <p className="text-sm text-secondary-500">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link to={`/merchant/orders/${id}/invoice`} className="btn-secondary flex items-center space-x-2">
            <FiPrinter className="w-4 h-4" /><span>Invoice</span>
          </Link>
          {!['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
            <button onClick={() => setCancelModal(true)} className="btn-secondary text-red-600 flex items-center space-x-2">
              <FiX className="w-4 h-4" /><span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">Order Timeline</h2>
              {!['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
                <button onClick={() => { setNewStatus(order.status); setStatusModal(true); }} className="btn-primary text-sm px-3 py-1.5">Update Status</button>
              )}
            </div>
            <div className="flex items-center justify-between mb-6">
              {statusFlow.map((s, i) => (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStep ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-500'
                  }`}>{i + 1}</div>
                  <p className={`text-xs mt-1 ${i <= currentStep ? 'text-primary-600 font-medium' : 'text-secondary-500'}`}>{s}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {order.timeline?.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-3 p-3 bg-secondary-50 rounded-lg">
                  <FiClock className="w-4 h-4 text-secondary-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[entry.status]}`}>{entry.status}</span>
                      <span className="text-xs text-secondary-400">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    {entry.note && <p className="text-sm text-secondary-600 mt-1">{entry.note}</p>}
                    {entry.user && <p className="text-xs text-secondary-400 mt-1">by {entry.user.firstName} {entry.user.lastName}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-secondary-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-secondary-400"><FiPackage className="w-5 h-5" /></div>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{item.name}</p>
                      <p className="text-xs text-secondary-500">SKU: {item.sku} &middot; Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-secondary-900">{formatCurrency(Number(item.total))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center space-x-2 mb-3">
              <FiUser className="w-4 h-4 text-secondary-500" />
              <h3 className="text-sm font-semibold text-secondary-900">Customer</h3>
            </div>
            {order.customer ? (
              <div>
                <p className="text-sm font-medium text-secondary-900">{order.customer.firstName} {order.customer.lastName}</p>
                <p className="text-xs text-secondary-500">{order.customer.email}</p>
                <Link to={`/merchant/customers/${order.customer.id}`} className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block">View Profile</Link>
              </div>
            ) : <p className="text-sm text-secondary-500">Guest</p>}
          </div>

          {order.shippingAddress && (
            <div className="card p-5">
              <div className="flex items-center space-x-2 mb-3">
                <FiMapPin className="w-4 h-4 text-secondary-500" />
                <h3 className="text-sm font-semibold text-secondary-900">Shipping Address</h3>
              </div>
              <p className="text-sm text-secondary-700">{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p className="text-sm text-secondary-700">{order.shippingAddress.address2}</p>}
              <p className="text-sm text-secondary-700">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p className="text-sm text-secondary-700">{order.shippingAddress.country}</p>
            </div>
          )}

          {order.billingAddress && (
            <div className="card p-5">
              <div className="flex items-center space-x-2 mb-3">
                <FiCreditCard className="w-4 h-4 text-secondary-500" />
                <h3 className="text-sm font-semibold text-secondary-900">Billing Address</h3>
              </div>
              <p className="text-sm text-secondary-700">{order.billingAddress.address1}</p>
              <p className="text-sm text-secondary-700">{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}</p>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center space-x-2 mb-3">
              <FiTruck className="w-4 h-4 text-secondary-500" />
              <h3 className="text-sm font-semibold text-secondary-900">Shipping</h3>
            </div>
            {order.shipping ? (
              <div className="space-y-1">
                <p className="text-sm text-secondary-700">Carrier: {order.shipping.carrier || 'N/A'}</p>
                <p className="text-sm text-secondary-700">Method: {order.shipping.method || 'N/A'}</p>
                {order.shipping.trackingNumber && <p className="text-sm text-secondary-700">Tracking: {order.shipping.trackingNumber}</p>}
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                  order.shipping.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>{order.shipping.status}</span>
              </div>
            ) : <p className="text-sm text-secondary-500">No shipping info</p>}
          </div>

          <div className="card p-5">
            <div className="flex items-center space-x-2 mb-3">
              <FiCreditCard className="w-4 h-4 text-secondary-500" />
              <h3 className="text-sm font-semibold text-secondary-900">Payment</h3>
            </div>
            {order.payment ? (
              <div className="space-y-1">
                <p className="text-sm text-secondary-700">Method: {order.payment.method}</p>
                <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${paymentStatusColors[order.payment.status]}`}>{order.payment.status}</span>
                {order.payment.transactionId && <p className="text-xs text-secondary-500">Txn: {order.payment.transactionId}</p>}
              </div>
            ) : <p className="text-sm text-secondary-500">No payment info</p>}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-3">Order Summary</h3>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Subtotal</dt><dd className="text-sm text-secondary-900">{formatCurrency(Number(order.subtotal))}</dd></div>
              {Number(order.discountAmount) > 0 && <div className="flex justify-between"><dt className="text-sm text-secondary-600">Discount</dt><dd className="text-sm text-green-600">-{formatCurrency(Number(order.discountAmount))}</dd></div>}
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Shipping</dt><dd className="text-sm text-secondary-900">{formatCurrency(Number(order.shippingAmount))}</dd></div>
              {Number(order.taxAmount) > 0 && <div className="flex justify-between"><dt className="text-sm text-secondary-600">Tax</dt><dd className="text-sm text-secondary-900">{formatCurrency(Number(order.taxAmount))}</dd></div>}
              <div className="border-t border-secondary-200 pt-2 flex justify-between"><dt className="text-sm font-semibold text-secondary-900">Total</dt><dd className="text-sm font-bold text-secondary-900">{formatCurrency(Number(order.total))}</dd></div>
              <div className="flex justify-between"><dt className="text-xs text-secondary-500">Paid</dt><dd className="text-xs text-secondary-900">{formatCurrency(Number(order.paidAmount))}</dd></div>
              {Number(order.dueAmount) > 0 && <div className="flex justify-between"><dt className="text-xs text-red-600">Due</dt><dd className="text-xs text-red-600 font-medium">{formatCurrency(Number(order.dueAmount))}</dd></div>}
            </dl>
          </div>
        </div>
      </div>

      {statusModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setStatusModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Update Order Status</h2>
            <div className="space-y-4">
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field">
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="input-field min-h-[80px]" placeholder="Add a note (optional)" />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setStatusModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
              <button onClick={handleUpdateStatus} className="btn-primary px-4 py-2">Update</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {cancelModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCancelModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Cancel Order</h2>
            <p className="text-sm text-secondary-600 mb-4">Are you sure you want to cancel {order.orderNumber}?</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input-field min-h-[80px]" placeholder="Reason for cancellation..." />
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setCancelModal(false)} className="btn-secondary px-4 py-2">Keep Order</button>
              <button onClick={handleCancel} className="btn-primary bg-red-600 hover:bg-red-700 px-4 py-2">Cancel Order</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
