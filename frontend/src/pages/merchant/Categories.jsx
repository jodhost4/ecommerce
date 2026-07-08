import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronRight as FiChevronRightIcon, FiList, FiGrid } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialForm = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  image: '',
  banner: '',
  isActive: true,
  sortOrder: 0,
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const response = await api.get('/categories', { params });
      setCategories(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchCategories();
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ ...initialForm });
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      parentId: category.parentId || '',
      image: category.image || '',
      banner: category.banner || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
      metaKeywords: category.metaKeywords || '',
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'name' && !editingCategory) {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      setShowModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const affected = category._count?.products || 0;
    setDeleteConfirm(category);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/categories/${deleteConfirm.id}`);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
      setDeleteConfirm(null);
    }
  };

  const renderTree = (parentId = null, depth = 0) => {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((category) => (
        <div key={category.id}>
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hover:bg-secondary-50 transition-colors"
          >
            <td className="px-4 py-3">
              <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                <span className="text-secondary-400 mr-2">{depth > 0 ? '└─' : ''}</span>
                <div className="w-8 h-8 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                  {category.image ? (
                    <img src={category.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary-400 text-xs">No img</div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-secondary-900">{category.name}</p>
                  <p className="text-xs text-secondary-500">{category.slug}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-secondary-600">{category.slug}</td>
            <td className="px-4 py-3 text-sm text-secondary-600">{category._count?.products || 0}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end space-x-2">
                <button onClick={() => openEdit(category)} className="btn-secondary p-2">
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(category)} className="btn-danger p-2">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </motion.tr>
          {renderTree(category.id, depth + 1)}
        </div>
      ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Categories</h1>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
          <FiPlus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center bg-secondary-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-2 rounded ${viewMode === 'tree' ? 'bg-white shadow-sm' : ''}`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Products</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12"><LoadingSpinner /></td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-secondary-500">No categories found</td>
                </tr>
              ) : viewMode === 'tree' ? (
                renderTree()
              ) : (
                categories.map((category) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-secondary-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                          {category.image ? (
                            <img src={category.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-secondary-400 text-xs">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{category.name}</p>
                          {category.parent && <p className="text-xs text-secondary-400">Parent: {category.parent.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-600">{category.slug}</td>
                    <td className="px-4 py-3 text-sm text-secondary-600">{category._count?.products || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openEdit(category)} className="btn-secondary p-2">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(category)} className="btn-danger p-2">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
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
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="btn-secondary p-2 disabled:opacity-50"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-secondary-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-sm rounded-md ${p === pagination.page ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-200'}`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
                className="btn-secondary p-2 disabled:opacity-50"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
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
                <h2 className="text-lg font-semibold text-secondary-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingCategory(null); }} className="text-secondary-400 hover:text-secondary-600">
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Slug</label>
                    <input type="text" name="slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="input-field" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="input-field" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Parent Category</label>
                    <select name="parentId" value={form.parentId} onChange={handleChange} className="input-field">
                      <option value="">None (Top Level)</option>
                      {categories
                        .filter((c) => c.id !== editingCategory?.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Image URL</label>
                    <input type="text" name="image" value={form.image} onChange={handleChange} className="input-field" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Banner URL</label>
                    <input type="text" name="banner" value={form.banner} onChange={handleChange} className="input-field" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Sort Order</label>
                    <input type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange} className="input-field" min={0} />
                  </div>
                  <div className="flex items-center pt-6">
                    <input type="checkbox" id="isActive" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded border-secondary-300 text-primary-600" />
                    <label htmlFor="isActive" className="ml-2 text-sm text-secondary-700">Active</label>
                  </div>
                  <div className="col-span-2 border-t border-secondary-200 pt-4">
                    <h4 className="text-sm font-medium text-secondary-700 mb-3">SEO</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-secondary-500 mb-1">Meta Title</label>
                        <input type="text" name="metaTitle" value={form.metaTitle} onChange={handleChange} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-secondary-500 mb-1">Meta Description</label>
                        <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs text-secondary-500 mb-1">Meta Keywords</label>
                        <input type="text" name="metaKeywords" value={form.metaKeywords} onChange={handleChange} className="input-field" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
                  <button type="button" onClick={() => { setShowModal(false); setEditingCategory(null); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Delete Category</h3>
              <p className="text-sm text-secondary-600 mb-4">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              {deleteConfirm._count?.products > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    This category has <strong>{deleteConfirm._count.products}</strong> product(s). They will be uncategorized.
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                <button onClick={confirmDelete} className="btn-danger">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
