import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiEye, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-pink-100 text-pink-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundModal, setRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, methodFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) { setPage(1); fetchPayments(); }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      const res = await api.get('/payments', { params });
      setPayments(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    try {
      await api.post(`/payments/${selectedPayment.id}/refund`, {
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason,
      });
      toast.success('Refund processed');
      setRefundModal(false);
      setSelectedPayment(null);
      setRefundAmount('');
      setRefundReason('');
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Payments</h1>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input type="text" placeholder="Search by order number..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
          </select>
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Methods</option>
            <option value="STRIPE">Stripe</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="COD">Cash on Delivery</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Method</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Transaction ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12"><LoadingSpinner /></td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-secondary-500">No payments found</td></tr>
              ) : (
                payments.map((payment, i) => (
                  <motion.tr key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-secondary-900">{payment.order?.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-secondary-700">{payment.method}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium text-secondary-900">{formatCurrency(Number(payment.amount))}</p>
                      {Number(payment.refundedAmount) > 0 && <p className="text-xs text-red-600">Refunded: {formatCurrency(Number(payment.refundedAmount))}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[payment.status]}`}>{payment.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-secondary-600 font-mono">{payment.transactionId || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-secondary-600">{formatDateTime(payment.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setSelectedPayment(payment)} className="btn-secondary p-2" title="View Details">
                          <FiEye className="w-4 h-4" />
                        </button>
                        {payment.status === 'COMPLETED' && (
                          <button onClick={() => { setSelectedPayment(payment); setRefundModal(true); }} className="btn-secondary p-2 text-red-600" title="Refund">
                            <FiRefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-200 bg-secondary-50">
            <p className="text-sm text-secondary-600">Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
            <div className="flex items-center space-x-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="btn-secondary p-2 disabled:opacity-50"><FiChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-secondary-400">...</span>}
                    <button onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md ${p === pagination.page ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-200'}`}>{p}</button>
                  </span>
                ))}
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="btn-secondary p-2 disabled:opacity-50"><FiChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {selectedPayment && !refundModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Payment Details</h2>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Order</dt><dd className="text-sm font-medium text-secondary-900">{selectedPayment.order?.orderNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Method</dt><dd className="text-sm font-medium text-secondary-900">{selectedPayment.method}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Amount</dt><dd className="text-sm font-medium text-secondary-900">{formatCurrency(Number(selectedPayment.amount))}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Status</dt><dd><span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[selectedPayment.status]}`}>{selectedPayment.status}</span></dd></div>
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Transaction ID</dt><dd className="text-sm font-mono text-secondary-900">{selectedPayment.transactionId || '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Refunded</dt><dd className="text-sm font-medium text-secondary-900">{formatCurrency(Number(selectedPayment.refundedAmount))}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-secondary-600">Date</dt><dd className="text-sm text-secondary-900">{formatDateTime(selectedPayment.createdAt)}</dd></div>
              {selectedPayment.paidAt && <div className="flex justify-between"><dt className="text-sm text-secondary-600">Paid At</dt><dd className="text-sm text-secondary-900">{formatDateTime(selectedPayment.paidAt)}</dd></div>}
            </dl>
            <div className="flex justify-end mt-6">
              <button onClick={() => setSelectedPayment(null)} className="btn-secondary px-4 py-2">Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {refundModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRefundModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Process Refund</h2>
            <p className="text-sm text-secondary-600 mb-4">Refund for {selectedPayment?.order?.orderNumber} ({formatCurrency(Number(selectedPayment?.amount))})</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Refund Amount</label>
                <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="input-field" placeholder={`Max: ${formatCurrency(Number(selectedPayment?.amount) - Number(selectedPayment?.refundedAmount))}`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="input-field min-h-[80px]" placeholder="Reason for refund..." />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setRefundModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
              <button onClick={handleRefund} className="btn-primary px-4 py-2">Process Refund</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
