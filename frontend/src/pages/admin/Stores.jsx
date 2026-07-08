import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEye, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw, FiToggleLeft, FiToggleRight, FiDollarSign, FiPackage, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStore, setSelectedStore] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/stores', { params });
      setStores(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function handleApprove(storeId, verified) {
    try {
      await api.put(`/admin/stores/${storeId}/approve`, { isVerified: verified });
      toast.success(verified ? 'Store approved' : 'Store rejected');
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update store');
    }
  }

  async function handleSuspend(storeId) {
    try {
      await api.put(`/admin/stores/${storeId}/suspend`);
      toast.success('Store status toggled');
      fetchStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle store');
    }
  }

  async function viewDetail(storeId) {
    setDetailLoading(true);
    setSelectedStore(null);
    try {
      const { data } = await api.get(`/admin/stores/${storeId}`);
      setSelectedStore(data.data);
    } catch (err) {
      toast.error('Failed to load store details');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Store Management</h1>
        <button onClick={fetchStores} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input type="text" placeholder="Search stores..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-48">
          <option value="">All Status</option>
          <option value="active">Active</option>
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
                    <th className="p-4 font-medium">Store</th>
                    <th className="p-4 font-medium">Owner</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Products</th>
                    <th className="p-4 font-medium">Revenue</th>
                    <th className="p-4 font-medium">Created</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-secondary-400">No stores found</td></tr>
                  ) : (
                    stores.map((store, i) => (
                      <motion.tr key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center">
                            {store.logo ? (
                              <img src={store.logo} alt="" className="w-8 h-8 rounded-lg object-cover mr-3" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs mr-3">{store.name?.[0]}</div>
                            )}
                            <div>
                              <p className="font-medium text-secondary-900">{store.name}</p>
                              <p className="text-xs text-secondary-400">{store.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-secondary-600">{store.owner?.firstName} {store.owner?.lastName}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {store.isActive ? 'Active' : 'Suspended'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {store.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-secondary-600">{store.productsCount || 0}</td>
                        <td className="p-4 font-medium text-secondary-900">${Number(store.revenue || 0).toLocaleString()}</td>
                        <td className="p-4 text-secondary-500 text-xs">{format(new Date(store.createdAt), 'MMM d, yyyy')}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => viewDetail(store.id)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button>
                          {!store.isVerified && (
                            <button onClick={() => handleApprove(store.id, true)} className="text-green-600 hover:text-green-700 p-1.5 rounded hover:bg-green-50 ml-1 transition-colors" title="Approve"><FiCheck className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleApprove(store.id, false)} className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 ml-1 transition-colors" title="Reject"><FiX className="w-4 h-4" /></button>
                          <button onClick={() => handleSuspend(store.id)} className="text-orange-600 hover:text-orange-700 p-1.5 rounded hover:bg-orange-50 ml-1 transition-colors" title="Toggle Suspend">
                            {store.isActive ? <FiToggleLeft className="w-4 h-4" /> : <FiToggleRight className="w-4 h-4" />}
                          </button>
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
              <p className="text-sm text-secondary-500">{total} total stores</p>
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
        {selectedStore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStore(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <div className="flex items-center">
                  {selectedStore.logo ? (
                    <img src={selectedStore.logo} alt="" className="w-10 h-10 rounded-lg object-cover mr-3" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-3">{selectedStore.name?.[0]}</div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">{selectedStore.name}</h2>
                    <p className="text-sm text-secondary-500">{selectedStore.slug}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStore(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <FiPackage className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{selectedStore._count?.products || 0}</p>
                    <p className="text-xs text-blue-600">Products</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <FiCalendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700">{selectedStore._count?.orders || 0}</p>
                    <p className="text-xs text-green-600">Orders</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <FiDollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-700">${Number(selectedStore.revenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-purple-600">Revenue</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <FiUsers className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-orange-700">{selectedStore._count?.customers || 0}</p>
                    <p className="text-xs text-orange-600">Customers</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-secondary-700 mb-2">Store Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-secondary-500">Owner:</span> <span className="text-secondary-900">{selectedStore.owner?.firstName} {selectedStore.owner?.lastName}</span></div>
                    <div><span className="text-secondary-500">Email:</span> <span className="text-secondary-900">{selectedStore.email || selectedStore.owner?.email}</span></div>
                    <div><span className="text-secondary-500">Status:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedStore.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedStore.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div><span className="text-secondary-500">Verification:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedStore.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedStore.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedStore.description && (
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700 mb-1">Description</h3>
                    <p className="text-sm text-secondary-600">{selectedStore.description}</p>
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

function FiUsers({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}
