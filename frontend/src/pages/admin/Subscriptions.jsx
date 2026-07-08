import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEye, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw, FiCalendar, FiDollarSign, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'renewals', label: 'Renewals' },
];

const statusColors = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  renewal: 'bg-purple-100 text-purple-800',
};

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, tab: activeTab };
      if (search) params.search = search;
      const { data } = await api.get('/admin/subscriptions', { params });
      setSubscriptions(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);
  useEffect(() => { setPage(1); }, [activeTab, search]);

  async function viewDetail(subId) {
    setDetailLoading(true);
    setSelectedSub(null);
    try {
      const { data } = await api.get(`/admin/subscriptions/${subId}`);
      setSelectedSub(data.data);
    } catch (err) {
      toast.error('Failed to load subscription details');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Subscription Management</h1>
        <button onClick={fetchSubscriptions} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input type="text" placeholder="Search by user or plan..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 w-full" />
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-secondary-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}>
            {tab.label}
          </button>
        ))}
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
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Plan</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Start Date</th>
                    <th className="p-4 font-medium">End Date</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-secondary-400">No subscriptions found</td></tr>
                  ) : (
                    subscriptions.map((sub, i) => (
                      <motion.tr key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs mr-3">
                              {sub.user?.firstName?.[0]}{sub.user?.lastName?.[0]}
                            </div>
                            <span className="font-medium text-secondary-900">{sub.user?.firstName} {sub.user?.lastName}</span>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-secondary-900">{sub.plan?.name || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sub.status] || 'bg-gray-100 text-gray-800'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-secondary-500 text-xs">{sub.startDate ? format(new Date(sub.startDate), 'MMM d, yyyy') : '-'}</td>
                        <td className="p-4 text-secondary-500 text-xs">{sub.endDate ? format(new Date(sub.endDate), 'MMM d, yyyy') : '-'}</td>
                        <td className="p-4 font-medium text-secondary-900">${Number(sub.amount || 0).toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => viewDetail(sub.id)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">{total} total subscriptions</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 rounded-lg disabled:opacity-50"><FiChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-secondary-600 px-3">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 rounded-lg disabled:opacity-50"><FiChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedSub && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSub(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-3">
                    {selectedSub.user?.firstName?.[0]}{selectedSub.user?.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">{selectedSub.user?.firstName} {selectedSub.user?.lastName}</h2>
                    <p className="text-sm text-secondary-500">{selectedSub.user?.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSub(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <FiCalendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-600">Plan</p>
                    <p className="text-lg font-bold text-blue-700">{selectedSub.plan?.name || '-'}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <FiDollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-purple-600">Amount</p>
                    <p className="text-lg font-bold text-purple-700">${Number(selectedSub.amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-secondary-700 mb-3">Subscription Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-secondary-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedSub.status] || 'bg-gray-100 text-gray-800'}`}>{selectedSub.status}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-secondary-500">Start Date</span><span className="font-medium text-secondary-900">{selectedSub.startDate ? format(new Date(selectedSub.startDate), 'MMM d, yyyy') : '-'}</span></div>
                    <div className="flex justify-between"><span className="text-secondary-500">End Date</span><span className="font-medium text-secondary-900">{selectedSub.endDate ? format(new Date(selectedSub.endDate), 'MMM d, yyyy') : '-'}</span></div>
                    <div className="flex justify-between"><span className="text-secondary-500">Billing Interval</span><span className="font-medium text-secondary-900">{selectedSub.plan?.interval || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-secondary-500">Auto Renew</span><span className="font-medium text-secondary-900">{selectedSub.autoRenew ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>

                {selectedSub.invoices?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700 mb-3">Recent Invoices</h3>
                    <div className="space-y-2">
                      {selectedSub.invoices.map((inv, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium text-secondary-900">${Number(inv.amount).toLocaleString()}</p>
                            <p className="text-xs text-secondary-400">{inv.createdAt ? format(new Date(inv.createdAt), 'MMM d, yyyy') : '-'}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{inv.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
}
