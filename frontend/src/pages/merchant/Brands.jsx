import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiX, FiToggleLeft, FiToggleRight, FiExternalLink, FiImage } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialForm = {
  name: '',
  description: '',
  logo: '',
  website: '',
  isActive: true,
};

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, [page]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api.get('/brands', { params });
      setBrands(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchBrands();
  };

  const openCreate = () => {
    setEditingBrand(null);
    setForm({ ...initialForm });
    setShowModal(true);
  };

  const openEdit = (brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name || '',
      description: brand.description || '',
      logo: brand.logo || '',
      website: brand.website || '',
      isActive: brand.isActive,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Brand name is required'); return; }
    setSaving(true);
    try {
      if (editingBrand) {
        await api.put(`/brands/${editingBrand.id}`, form);
        toast.success('Brand updated');
      } else {
        await api.post('/brands', form);
        toast.success('Brand created');
      }
      setShowModal(false);
      setEditingBrand(null);
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (brand) => {
    try {
      await api.put(`/brands/${brand.id}`, { isActive: !brand.isActive });
      toast.success(`Brand ${brand.isActive ? 'deactivated' : 'activated'}`);
      fetchBrands();
    } catch {
      toast.error('Failed to update brand');
    }
  };

  const handleDelete = async (brand) => {
    if (!confirm(`Delete brand "${brand.name}"?`)) return;
    try {
      await api.delete(`/brands/${brand.id}`);
      toast.success('Brand deleted');
      fetchBrands();
    } catch {
      toast.error('Failed to delete brand');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Brands</h1>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
          <FiPlus className="w-4 h-4" /><span>Add Brand</span>
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text" placeholder="Search brands..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Description</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12"><LoadingSpinner /></td></tr>
              ) : brands.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-secondary-500">No brands found</td></tr>
              ) : (
                brands.map((brand, i) => (
                  <motion.tr
                    key={brand.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiImage className="w-5 h-5 text-secondary-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{brand.name}</p>
                          {brand.website && (
                            <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                              <FiExternalLink className="w-3 h-3" /><span>{brand.website}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600 max-w-xs truncate">{brand.description || '—'}</td>
                    <td className="px-4 py-3 text-center text-sm text-secondary-900">{brand._count?.products || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${brand.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleToggleActive(brand)} className="btn-secondary p-2" title={brand.isActive ? 'Deactivate' : 'Activate'}>
                          {brand.isActive ? <FiToggleRight className="w-4 h-4 text-green-600" /> : <FiToggleLeft className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button onClick={() => openEdit(brand)} className="btn-secondary p-2"><FiEdit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(brand)} className="btn-danger p-2"><FiTrash2 className="w-4 h-4" /></button>
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
            <p className="text-sm text-secondary-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                <h2 className="text-lg font-semibold text-secondary-900">{editingBrand ? 'Edit Brand' : 'Create Brand'}</h2>
                <button onClick={() => { setShowModal(false); setEditingBrand(null); }} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Brand Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Logo URL</label>
                  <div className="flex items-center space-x-3">
                    <input type="text" name="logo" value={form.logo} onChange={handleChange} className="input-field flex-1" placeholder="https://..." />
                    {form.logo && (
                      <div className="w-10 h-10 rounded-lg border border-secondary-200 overflow-hidden flex-shrink-0">
                        <img src={form.logo} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Website</label>
                  <input type="text" name="website" value={form.website} onChange={handleChange} className="input-field" placeholder="https://example.com" />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded border-secondary-300 text-primary-600" />
                  <label htmlFor="isActive" className="text-sm text-secondary-700">Active</label>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingBrand(null); }} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingBrand ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
