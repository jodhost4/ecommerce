import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw, FiDollarSign, FiFilter, FiCheck, FiClock, FiArrowUp } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
};

const paymentMethods = ['', 'credit_card', 'paypal', 'stripe', 'bank_transfer'];

const statusFilters = ['', 'completed', 'pending', 'failed', 'refunded', 'processing'];

export default function PaymentsManagement() {
  const [activeSection, setActiveSection] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      const { data } = await api.get('/admin/payments', { params });
      setTransactions(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, methodFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { setPage(1); }, [search, statusFilter, methodFilter]);

  async function fetchPayouts() {
    setPayoutsLoading(true);
    try {
      const { data } = await api.get('/admin/payments/payouts');
      setPayouts(data.data);
    } catch (err) {
      toast.error('Failed to load payouts');
    } finally {
      setPayoutsLoading(false);
    }
  }

  async function fetchRefunds() {
    setRefundsLoading(true);
    try {
      const { data } = await api.get('/admin/payments/refunds');
      setRefunds(data.data);
    } catch (err) {
      toast.error('Failed to load refunds');
    } finally {
      setRefundsLoading(false);
    }
  }

  useEffect(() => {
    if (activeSection === 'payouts') fetchPayouts();
    if (activeSection === 'refunds') fetchRefunds();
  }, [activeSection]);

  async function handleProcessRefund(refundId, action) {
    try {
      await api.put(`/admin/payments/refunds/${refundId}`, { action });
      toast.success(`Refund ${action} successfully`);
      fetchRefunds();
      setProcessingRefund(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    }
  }

  async function handleProcessPayout(payoutId) {
    try {
      await api.put(`/admin/payments/payouts/${payoutId}/process`);
      toast.success('Payout processed');
      fetchPayouts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payout');
    }
  }

  const sections = [
    { key: 'transactions', label: 'Transactions' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'refunds', label: 'Refund Requests' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Payments</h1>
        <button onClick={() => { if (activeSection === 'transactions') fetchTransactions(); else if (activeSection === 'payouts') fetchPayouts(); else fetchRefunds(); }} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="flex gap-1 mb-6 bg-secondary-100 rounded-lg p-1 w-fit">
        {sections.map((sec) => (
          <button key={sec.key} onClick={() => setActiveSection(sec.key)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === sec.key ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}>
            {sec.label}
          </button>
        ))}
      </div>

      {activeSection === 'transactions' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input type="text" placeholder="Search by transaction ID or store..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 w-full" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
              <option value="">All Status</option>
              {statusFilters.filter(Boolean).map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input w-full sm:w-40">
              <option value="">All Methods</option>
              {paymentMethods.filter(Boolean).map((m) => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary-50 text-left text-secondary-600">
                        <th className="p-4 font-medium">Transaction ID</th>
                        <th className="p-4 font-medium">Store</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Fee</th>
                        <th className="p-4 font-medium">Net Amount</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Method</th>
                        <th className="p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-secondary-400">No transactions found</td></tr>
                      ) : (
                        transactions.map((tx, i) => (
                          <motion.tr key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                            <td className="p-4 font-mono text-xs text-secondary-900 font-medium">{tx.transactionId || tx.id}</td>
                            <td className="p-4 text-secondary-600">{tx.store?.name || '-'}</td>
                            <td className="p-4 font-medium text-secondary-900">${Number(tx.amount || 0).toLocaleString()}</td>
                            <td className="p-4 text-secondary-500">${Number(tx.fee || 0).toLocaleString()}</td>
                            <td className="p-4 font-medium text-secondary-900">${Number(tx.netAmount || tx.amount - tx.fee || 0).toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status] || 'bg-gray-100 text-gray-800'}`}>{tx.status}</span>
                            </td>
                            <td className="p-4 text-secondary-500 text-xs">{tx.paymentMethod?.replace('_', ' ') || '-'}</td>
                            <td className="p-4 text-secondary-500 text-xs">{tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy') : '-'}</td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-secondary-500">{total} total transactions</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 rounded-lg disabled:opacity-50"><FiChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm text-secondary-600 px-3">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 rounded-lg disabled:opacity-50"><FiChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeSection === 'payouts' && (
        <>
          {payoutsLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="card overflow-hidden">
              {payouts.length === 0 ? (
                <div className="p-12 text-center">
                  <FiArrowUp className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">No Payouts</h3>
                  <p className="text-secondary-500">No payout requests have been made yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary-50 text-left text-secondary-600">
                        <th className="p-4 font-medium">Store</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Method</th>
                        <th className="p-4 font-medium">Requested</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p, i) => (
                        <motion.tr key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                          <td className="p-4 font-medium text-secondary-900">{p.store?.name}</td>
                          <td className="p-4 font-medium text-secondary-900">${Number(p.amount).toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
                          </td>
                          <td className="p-4 text-secondary-500 text-xs">{p.method || '-'}</td>
                          <td className="p-4 text-secondary-500 text-xs">{p.createdAt ? format(new Date(p.createdAt), 'MMM d, yyyy') : '-'}</td>
                          <td className="p-4 text-right">
                            {p.status === 'pending' && (
                              <button onClick={() => handleProcessPayout(p.id)} className="btn-primary text-xs px-3 py-1.5 rounded-lg">Process</button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeSection === 'refunds' && (
        <>
          {refundsLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="card overflow-hidden">
              {refunds.length === 0 ? (
                <div className="p-12 text-center">
                  <FiDollarSign className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">No Refund Requests</h3>
                  <p className="text-secondary-500">No refund requests have been submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary-50 text-left text-secondary-600">
                        <th className="p-4 font-medium">Transaction</th>
                        <th className="p-4 font-medium">Store</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Reason</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refunds.map((r, i) => (
                        <motion.tr key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                          <td className="p-4 font-mono text-xs text-secondary-900">{r.transactionId || r.id}</td>
                          <td className="p-4 text-secondary-600">{r.store?.name || '-'}</td>
                          <td className="p-4 font-medium text-secondary-900">${Number(r.amount).toLocaleString()}</td>
                          <td className="p-4 text-secondary-500 max-w-[200px] truncate">{r.reason || '-'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                          </td>
                          <td className="p-4 text-secondary-500 text-xs">{r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy') : '-'}</td>
                          <td className="p-4 text-right">
                            {r.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleProcessRefund(r.id, 'approve')} className="text-green-600 hover:text-green-700 p-1.5 rounded hover:bg-green-50 transition-colors" title="Approve"><FiCheck className="w-4 h-4" /></button>
                                <button onClick={() => handleProcessRefund(r.id, 'reject')} className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors" title="Reject"><FiX className="w-4 h-4" /></button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
