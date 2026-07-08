import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiTag, FiPercent, FiZap, FiStar, FiLink, FiClock, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const tabs = [
  { id: 'coupons', label: 'Coupons', icon: FiTag },
  { id: 'discounts', label: 'Discounts', icon: FiPercent },
  { id: 'flash-sales', label: 'Flash Sales', icon: FiZap },
  { id: 'featured', label: 'Featured Products', icon: FiStar },
];

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [editingFlash, setEditingFlash] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});

  const flashForm = {
    name: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    startsAt: '',
    endsAt: '',
    productIds: [],
    isActive: true,
  };

  useEffect(() => {
    if (activeTab === 'coupons') fetchCoupons();
    else if (activeTab === 'discounts') fetchDiscounts();
    else if (activeTab === 'flash-sales') fetchFlashSales();
    else if (activeTab === 'featured') fetchFeaturedProducts();
  }, [activeTab, page]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const updated = {};
      flashSales.forEach((sale) => {
        const end = new Date(sale.endsAt);
        const diff = end - now;
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          updated[sale.id] = `${h}h ${m}m ${s}s`;
        } else {
          updated[sale.id] = 'Ended';
        }
      });
      setTimeLeft(updated);
    }, 1000);
    return () => clearInterval(timer);
  }, [flashSales]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api.get('/coupons', { params });
      setDiscounts(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, type: 'PERCENTAGE,FIXED' };
      if (search) params.search = search;
      const res = await api.get('/coupons', { params });
      setDiscounts(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSales = async () => {
    setLoading(true);
    try {
      // Flash sales = coupons with an expiry date (time-limited)
      const res = await api.get('/coupons', { params: { page, limit: 15, hasExpiry: true } });
      const data = (res.data.data || []).map((c) => ({
        ...c,
        discountType: c.type,
        discountValue: c.value,
        startsAt: c.startsAt,
        endsAt: c.expiresAt,
      }));
      setFlashSales(data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { isFeatured: true, limit: 50 } });
      setFeaturedProducts(res.data.data || []);
    } catch {
      toast.error('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { isFeatured: !product.isFeatured });
      toast.success(`Product ${product.isFeatured ? 'removed from' : 'added to'} featured`);
      fetchFeaturedProducts();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!confirm('Delete this coupon/discount?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Deleted successfully');
      if (activeTab === 'discounts') fetchDiscounts();
      else fetchCoupons();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaveFlash = async () => {
    if (!editingFlash.name || !editingFlash.discountValue || !editingFlash.endsAt) {
      toast.error('Please fill in required fields');
      return;
    }
    try {
      const payload = {
        code: `FLASH-${editingFlash.name.toUpperCase().replace(/\s+/g, '-').slice(0, 10)}-${Date.now().toString(36).slice(-4)}`,
        description: editingFlash.name,
        type: editingFlash.discountType || 'PERCENTAGE',
        value: parseFloat(editingFlash.discountValue),
        startsAt: editingFlash.startsAt || null,
        expiresAt: editingFlash.endsAt,
        isActive: editingFlash.isActive,
      };
      if (editingFlash.id) {
        await api.put(`/coupons/${editingFlash.id}`, payload);
        toast.success('Flash sale updated');
      } else {
        await api.post('/coupons', payload);
        toast.success('Flash sale created');
      }
      setShowFlashModal(false);
      setEditingFlash(null);
      fetchFlashSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save flash sale');
    }
  };

  const handleDeleteFlash = async (id) => {
    if (!confirm('Delete this flash sale?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Flash sale deleted');
      fetchFlashSales();
    } catch {
      toast.error('Failed to delete flash sale');
    }
  };

  const getTimeStatus = (sale) => {
    const now = new Date();
    const start = new Date(sale.startsAt);
    const end = new Date(sale.endsAt);
    if (now < start) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { label: 'Ended', color: 'bg-gray-100 text-gray-600' };
    return { label: 'Live', color: 'bg-green-100 text-green-800' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Marketing</h1>
        {activeTab === 'flash-sales' && (
          <button onClick={() => { setEditingFlash({ ...flashForm }); setShowFlashModal(true); }} className="btn-primary flex items-center space-x-2">
            <FiZap className="w-4 h-4" /><span>New Flash Sale</span>
          </button>
        )}
      </div>

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'coupons' && (
        <div className="card p-8 text-center">
          <FiTag className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Coupon Management</h3>
          <p className="text-secondary-500 mb-4">Create and manage discount coupons for your store</p>
          <Link to="/merchant/coupons" className="btn-primary inline-flex items-center space-x-2 px-4 py-2">
            <FiLink className="w-4 h-4" /><span>Go to Coupons</span>
          </Link>
        </div>
      )}

      {activeTab === 'discounts' && (
        <>
          <div className="card p-4 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input type="text" placeholder="Search discounts..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setPage(1) && fetchDiscounts()} className="input-field pl-10" />
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-50 border-b border-secondary-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Valid Until</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-12"><LoadingSpinner /></td></tr>
                  ) : discounts.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-secondary-500">No discounts found</td></tr>
                  ) : (
                    discounts.map((d, i) => (
                      <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-secondary-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-secondary-900">{d.name}</td>
                        <td className="px-4 py-3 text-sm text-secondary-600">{d.type}</td>
                        <td className="px-4 py-3 text-sm text-secondary-900">{d.type === 'PERCENTAGE' ? `${d.value}%` : formatCurrency(Number(d.value))}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${d.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-600">{d.endsAt ? formatDateTime(d.endsAt) : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteDiscount(d.id)} className="btn-danger p-2"><FiTrash2 className="w-4 h-4" /></button>
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

      {activeTab === 'flash-sales' && (
        <>
          <div className="card p-4 mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input type="text" placeholder="Search flash sales..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setPage(1) && fetchFlashSales()} className="input-field pl-10" />
            </div>
          </div>
          <div className="space-y-4">
            {loading ? (
              <LoadingSpinner />
            ) : flashSales.length === 0 ? (
              <div className="card p-12 text-center">
                <FiZap className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-500">No flash sales yet</p>
              </div>
            ) : (
              flashSales.map((sale, i) => {
                const status = getTimeStatus(sale);
                return (
                  <motion.div key={sale.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${status.label === 'Live' ? 'bg-green-100' : 'bg-secondary-100'}`}>
                          <FiZap className={`w-5 h-5 ${status.label === 'Live' ? 'text-green-600' : 'text-secondary-500'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900">{sale.name}</h3>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">{sale.discountType === 'PERCENTAGE' ? `${sale.discountValue}%` : formatCurrency(Number(sale.discountValue))} OFF</p>
                        {timeLeft[sale.id] && status.label === 'Live' && (
                          <p className="text-xs text-secondary-500 flex items-center justify-end space-x-1 mt-1">
                            <FiClock className="w-3 h-3" /><span>{timeLeft[sale.id]}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-secondary-600">Starts: {sale.startsAt ? formatDateTime(sale.startsAt) : 'Immediately'}</div>
                      <div className="text-secondary-600">Ends: {formatDateTime(sale.endsAt)}</div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-secondary-100">
                      <button onClick={() => { setEditingFlash(sale); setShowFlashModal(true); }} className="btn-secondary p-2"><FiEdit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteFlash(sale.id)} className="btn-danger p-2"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}

      {activeTab === 'featured' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary-50 border-b border-secondary-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Sales</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Featured</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-12"><LoadingSpinner /></td></tr>
                ) : featuredProducts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-secondary-500">No products found</td></tr>
                ) : (
                  featuredProducts.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                            {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-secondary-400 text-xs">N/A</div>}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-secondary-900">{p.name}</p>
                            <p className="text-xs text-secondary-500">{p.category?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-secondary-900">{formatCurrency(Number(p.price))}</td>
                      <td className="px-4 py-3 text-center text-sm text-secondary-600">{p.totalSold || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${p.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                          {p.isFeatured ? 'Featured' : 'Regular'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleToggleFeatured(p)} className={`btn-secondary p-2 ${p.isFeatured ? 'text-yellow-600' : ''}`}>
                          <FiStar className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFlashModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowFlashModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">{editingFlash?.id ? 'Edit Flash Sale' : 'Create Flash Sale'}</h2>
                <button onClick={() => setShowFlashModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Sale Name *</label>
                  <input type="text" value={editingFlash?.name || ''} onChange={(e) => setEditingFlash({ ...editingFlash, name: e.target.value })} className="input-field" placeholder="Summer Flash Sale" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Discount Type</label>
                    <select value={editingFlash?.discountType || 'PERCENTAGE'} onChange={(e) => setEditingFlash({ ...editingFlash, discountType: e.target.value })} className="input-field">
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Discount Value *</label>
                    <div className="relative">
                      {editingFlash?.discountType === 'PERCENTAGE' ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">%</span> : <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">$</span>}
                      <input type="number" step="0.01" value={editingFlash?.discountValue || ''} onChange={(e) => setEditingFlash({ ...editingFlash, discountValue: e.target.value })} className={`input-field ${editingFlash?.discountType === 'PERCENTAGE' ? 'pr-8' : 'pl-8'}`} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                    <input type="datetime-local" value={editingFlash?.startsAt ? editingFlash.startsAt.slice(0, 16) : ''} onChange={(e) => setEditingFlash({ ...editingFlash, startsAt: e.target.value || null })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">End Date *</label>
                    <input type="datetime-local" value={editingFlash?.endsAt ? editingFlash.endsAt.slice(0, 16) : ''} onChange={(e) => setEditingFlash({ ...editingFlash, endsAt: e.target.value })} className="input-field" required />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="flashActive" checked={editingFlash?.isActive ?? true} onChange={(e) => setEditingFlash({ ...editingFlash, isActive: e.target.checked })} className="rounded border-secondary-300" />
                  <label htmlFor="flashActive" className="text-sm text-secondary-700">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowFlashModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSaveFlash} className="btn-primary px-4 py-2">{editingFlash?.id ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
