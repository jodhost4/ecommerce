import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiPercent, FiDollarSign, FiTruck, FiBarChart2, FiTag } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export default function Coupons() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [coupons, setCoupons] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const tabs = [
    { id: 'coupons', label: 'Coupons', icon: FiTag },
    { id: 'reports', label: 'Reports', icon: FiBarChart2 },
  ];

  useEffect(() => {
    if (activeTab === 'coupons') fetchCoupons();
    else fetchReports();
  }, [activeTab, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search && activeTab === 'coupons') { setPage(1); fetchCoupons(); }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get('/coupons', { params });
      setCoupons(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons/reports');
      setReports(res.data.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        code: editingCoupon.code,
        description: editingCoupon.description,
        type: editingCoupon.type,
        value: parseFloat(editingCoupon.value) || 0,
        minOrderAmount: editingCoupon.minOrderAmount ? parseFloat(editingCoupon.minOrderAmount) : null,
        maxDiscount: editingCoupon.maxDiscount ? parseFloat(editingCoupon.maxDiscount) : null,
        usageLimit: editingCoupon.usageLimit ? parseInt(editingCoupon.usageLimit) : null,
        perUserLimit: parseInt(editingCoupon.perUserLimit) || 1,
        startsAt: editingCoupon.startsAt || null,
        expiresAt: editingCoupon.expiresAt || null,
        isActive: editingCoupon.isActive,
      };

      if (editingCoupon.id) {
        await api.put(`/coupons/${editingCoupon.id}`, payload);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created');
      }
      setShowModal(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const openCreateModal = () => {
    setEditingCoupon({
      code: '', description: '', type: 'PERCENTAGE', value: '',
      minOrderAmount: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
      startsAt: '', expiresAt: '', isActive: true,
    });
    setShowModal(true);
  };

  const typeIcon = (type) => {
    if (type === 'PERCENTAGE') return <FiPercent className="w-4 h-4" />;
    if (type === 'FIXED') return <FiDollarSign className="w-4 h-4" />;
    return <FiTruck className="w-4 h-4" />;
  };

  const isExpired = (coupon) => coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isActive = (coupon) => coupon.isActive && !isExpired(coupon);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Coupons</h1>
        {activeTab === 'coupons' && (
          <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
            <FiPlus className="w-4 h-4" /><span>Create Coupon</span>
          </button>
        )}
      </div>

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'coupons' && (
        <>
          <div className="card p-4 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input type="text" placeholder="Search by code or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-50 border-b border-secondary-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Value</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Usage</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Expiry</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-12"><LoadingSpinner /></td></tr>
                  ) : coupons.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-secondary-500">No coupons found</td></tr>
                  ) : (
                    coupons.map((coupon, i) => (
                      <motion.tr key={coupon.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-secondary-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-mono font-bold text-secondary-900">{coupon.code}</p>
                            {coupon.description && <p className="text-xs text-secondary-500">{coupon.description}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center space-x-1 text-sm text-secondary-700">
                            {typeIcon(coupon.type)}
                            <span>{coupon.type.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-secondary-900">
                            {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatCurrency(Number(coupon.value))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-secondary-700">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</span>
                        </td>
                        <td className="px-4 py-3">
                          {isExpired(coupon) ? (
                            <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Expired</span>
                          ) : coupon.isActive ? (
                            <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary-600">{coupon.expiresAt ? formatDate(coupon.expiresAt) : 'No expiry'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button onClick={() => { setEditingCoupon(coupon); setShowModal(true); }} className="btn-secondary p-2"><FiEdit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(coupon.id)} className="btn-secondary p-2 text-red-600"><FiTrash2 className="w-4 h-4" /></button>
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
        </>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loading ? <LoadingSpinner /> : reports.length === 0 ? (
            <div className="card p-12 text-center"><p className="text-secondary-500">No coupon usage data</p></div>
          ) : (
            reports.map((report) => (
              <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-secondary-900 font-mono">{report.code}</h3>
                    <p className="text-xs text-secondary-500">{report.type} &middot; Value: {report.type === 'PERCENTAGE' ? `${report.value}%` : formatCurrency(Number(report.value))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-900">{report.usedCount} uses</p>
                    <p className="text-xs text-secondary-500">{report.orderCount} orders</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-500">Total Discount Given</p>
                    <p className="text-lg font-bold text-secondary-900">{formatCurrency(report.totalDiscount)}</p>
                  </div>
                  <div className="p-3 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-500">Revenue from Coupon Orders</p>
                    <p className="text-lg font-bold text-secondary-900">{formatCurrency(report.totalRevenue)}</p>
                  </div>
                </div>
                {report.orders?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-secondary-700 mb-2 uppercase tracking-wider">Recent Orders</h4>
                    <div className="space-y-1">
                      {report.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <span className="text-primary-600">{order.orderNumber}</span>
                          <span className="text-secondary-600">{formatCurrency(Number(order.total))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">{editingCoupon?.id ? 'Edit Coupon' : 'Create Coupon'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Coupon Code</label>
                    <input type="text" value={editingCoupon?.code || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })} className="input-field uppercase" placeholder="SUMMER20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Discount Type</label>
                    <select value={editingCoupon?.type || 'PERCENTAGE'} onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value })} className="input-field">
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed Amount</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                  <input type="text" value={editingCoupon?.description || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })} className="input-field" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Value</label>
                    <div className="relative">
                      {editingCoupon?.type === 'PERCENTAGE' ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">%</span> : <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>}
                      <input type="number" step="0.01" value={editingCoupon?.value || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, value: e.target.value })} className={`input-field ${editingCoupon?.type === 'PERCENTAGE' ? 'pr-8' : 'pl-8'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Max Discount</label>
                    <input type="number" step="0.01" value={editingCoupon?.maxDiscount || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, maxDiscount: e.target.value })} className="input-field" placeholder="No limit" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Min Order Amount</label>
                    <input type="number" step="0.01" value={editingCoupon?.minOrderAmount || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderAmount: e.target.value })} className="input-field" placeholder="No minimum" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Per User Limit</label>
                    <input type="number" value={editingCoupon?.perUserLimit || '1'} onChange={(e) => setEditingCoupon({ ...editingCoupon, perUserLimit: e.target.value })} className="input-field" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Usage Limit</label>
                    <input type="number" value={editingCoupon?.usageLimit || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, usageLimit: e.target.value })} className="input-field" placeholder="Unlimited" />
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                    <input type="datetime-local" value={editingCoupon?.startsAt ? editingCoupon.startsAt.slice(0, 16) : ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, startsAt: e.target.value || null })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                    <input type="datetime-local" value={editingCoupon?.expiresAt ? editingCoupon.expiresAt.slice(0, 16) : ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value || null })} className="input-field" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="couponActive" checked={editingCoupon?.isActive ?? true} onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })} className="rounded border-secondary-300" />
                  <label htmlFor="couponActive" className="text-sm text-secondary-700">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSave} className="btn-primary px-4 py-2">{editingCoupon?.id ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
