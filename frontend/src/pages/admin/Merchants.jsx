import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEye, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw, FiToggleLeft, FiToggleRight, FiDollarSign, FiPackage, FiCalendar, FiMail, FiPhone, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-orange-100 text-orange-800',
};

export default function Merchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/merchants', { params });
      setMerchants(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function handleVerify(merchantId) {
    try {
      await api.put(`/admin/merchants/${merchantId}/verify`);
      toast.success('Merchant verified successfully');
      fetchMerchants();
      if (selectedMerchant?.id === merchantId) viewDetail(merchantId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify merchant');
    }
  }

  async function handleToggleStatus(merchantId) {
    setSaving(true);
    try {
      await api.put(`/admin/merchants/${merchantId}/toggle-status`);
      toast.success('Merchant status updated');
      fetchMerchants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update merchant');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(merchantId) {
    setSaving(true);
    try {
      await api.delete(`/admin/merchants/${merchantId}`);
      toast.success('Merchant deleted');
      setDeleteConfirm(null);
      fetchMerchants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete merchant');
    } finally {
      setSaving(false);
    }
  }

  async function viewDetail(merchantId) {
    setDetailLoading(true);
    setSelectedMerchant(null);
    try {
      const { data } = await api.get(`/admin/merchants/${merchantId}`);
      setSelectedMerchant(data.data);
    } catch (err) {
      toast.error('Failed to load merchant details');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Merchant Management</h1>
        <button onClick={fetchMerchants} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input type="text" placeholder="Search by name, email or store..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
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
                    <th className="p-4 font-medium">Merchant</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Store</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Verification</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-secondary-400">No merchants found</td></tr>
                  ) : (
                    merchants.map((m, i) => (
                      <motion.tr key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs mr-3">
                              {m.firstName?.[0]}{m.lastName?.[0]}
                            </div>
                            <span className="font-medium text-secondary-900">{m.firstName} {m.lastName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-secondary-600">{m.email}</td>
                        <td className="p-4 text-secondary-600">{m.store?.name || '-'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[m.status] || 'bg-gray-100 text-gray-800'}`}>
                            {m.status || 'unknown'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {m.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="p-4 text-secondary-500 text-xs">{m.createdAt ? format(new Date(m.createdAt), 'MMM d, yyyy') : '-'}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => viewDetail(m.id)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button>
                          {!m.isVerified && (
                            <button onClick={() => handleVerify(m.id)} className="text-blue-600 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50 ml-1 transition-colors" title="Verify"><FiCheck className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleToggleStatus(m.id)} className="text-orange-600 hover:text-orange-700 p-1.5 rounded hover:bg-orange-50 ml-1 transition-colors" title={m.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {m.status === 'active' ? <FiToggleLeft className="w-4 h-4" /> : <FiToggleRight className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setDeleteConfirm(m)} className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 ml-1 transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
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
              <p className="text-sm text-secondary-500">{total} total merchants</p>
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
        {selectedMerchant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMerchant(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-3">
                    {selectedMerchant.firstName?.[0]}{selectedMerchant.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">{selectedMerchant.firstName} {selectedMerchant.lastName}</h2>
                    <p className="text-sm text-secondary-500">{selectedMerchant.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMerchant(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <FiPackage className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{selectedMerchant.store?._count?.products || 0}</p>
                    <p className="text-xs text-blue-600">Products</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <FiCalendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700">{selectedMerchant.store?._count?.orders || 0}</p>
                    <p className="text-xs text-green-600">Orders</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <FiDollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-700">${Number(selectedMerchant.store?.revenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-purple-600">Revenue</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <FiUsers className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-orange-700">{selectedMerchant.store?._count?.customers || 0}</p>
                    <p className="text-xs text-orange-600">Customers</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-secondary-700 mb-3">Merchant Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center"><FiMail className="w-4 h-4 text-secondary-400 mr-2" /><span className="text-secondary-500">Email:</span><span className="text-secondary-900 ml-1">{selectedMerchant.email}</span></div>
                    {selectedMerchant.phone && <div className="flex items-center"><FiPhone className="w-4 h-4 text-secondary-400 mr-2" /><span className="text-secondary-500">Phone:</span><span className="text-secondary-900 ml-1">{selectedMerchant.phone}</span></div>}
                    <div><span className="text-secondary-500">Status:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedMerchant.status] || 'bg-gray-100 text-gray-800'}`}>{selectedMerchant.status}</span>
                    </div>
                    <div><span className="text-secondary-500">Verification:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedMerchant.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedMerchant.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div><span className="text-secondary-500">Store:</span><span className="text-secondary-900 ml-1">{selectedMerchant.store?.name || 'No store'}</span></div>
                    <div><span className="text-secondary-500">Joined:</span><span className="text-secondary-900 ml-1">{selectedMerchant.createdAt ? format(new Date(selectedMerchant.createdAt), 'MMM d, yyyy') : '-'}</span></div>
                  </div>
                </div>

                {selectedMerchant.store && (
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700 mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                      {(selectedMerchant.recentActivity || []).length === 0 ? (
                        <p className="text-sm text-secondary-400">No recent activity</p>
                      ) : (
                        selectedMerchant.recentActivity.map((act, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                            <p className="text-sm text-secondary-700">{act.description}</p>
                            <span className="text-xs text-secondary-400">{act.createdAt ? format(new Date(act.createdAt), 'MMM d, HH:mm') : '-'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><FiTrash2 className="w-6 h-6 text-red-600" /></div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Delete Merchant</h2>
                <p className="text-sm text-secondary-500 mb-6">Are you sure you want to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>? This action cannot be undone.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary px-4 py-2 rounded-lg">Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm.id)} disabled={saving} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    {saving ? 'Deleting...' : 'Delete Merchant'}
                  </button>
                </div>
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

function FiUsers({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}
