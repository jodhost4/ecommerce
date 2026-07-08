import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchProducts();
  }, [page, sortField, sortDir]);

  useEffect(() => { fetchFilters(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) { setPage(1); fetchProducts(); }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFilters = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories?limit=100'),
        api.get('/brands?limit=100'),
      ]);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    } catch { }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (brandFilter) params.brandId = brandFilter;
      if (statusFilter) params.status = statusFilter;
      if (sortField) { params.sortBy = sortField; params.sortOrder = sortDir; }

      const response = await api.get('/products', { params });
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) { toast.error('Select products first'); return; }
    if (action === 'delete') {
      if (!confirm(`Delete ${selectedIds.length} products?`)) return;
      try {
        await Promise.all(selectedIds.map((id) => api.delete(`/products/${id}`)));
        toast.success(`${selectedIds.length} products deleted`);
        setSelectedIds([]);
        fetchProducts();
      } catch { toast.error('Bulk delete failed'); }
    } else {
      toast.success(`Bulk ${action} initiated for ${selectedIds.length} products`);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const SortHeader = ({ field, children }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:text-secondary-700 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field ? (
          sortDir === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />
        ) : null}
      </div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
        <Link to="/merchant/products/new" className="btn-primary flex items-center space-x-2">
          <FiPlus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {selectedIds.length > 0 && (
              <>
                <span className="text-sm text-secondary-500">{selectedIds.length} selected</span>
                <select onChange={(e) => handleBulkAction(e.target.value)} className="input-field text-sm py-1 w-auto" defaultValue="">
                  <option value="" disabled>Bulk Actions</option>
                  <option value="active">Mark Active</option>
                  <option value="inactive">Mark Inactive</option>
                  <option value="delete">Delete</option>
                </select>
              </>
            )}
          </div>
          <button onClick={() => { setPage(1); fetchProducts(); }} className="btn-secondary text-sm">Apply Filters</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <SortHeader field="name">Product</SortHeader>
                <SortHeader field="sku">SKU</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                <SortHeader field="basePrice">Price</SortHeader>
                <SortHeader field="inventory">Stock</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12"><LoadingSpinner /></td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-secondary-500">No products found</td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImage = product.images?.[0];
                  const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? product.inventory?.[0]?.quantity ?? 0;
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-secondary-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/merchant/products/${product.id}`} className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                            {primaryImage ? (
                              <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-secondary-400 text-xs">No img</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-secondary-900 truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-secondary-500">{product.slug}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-600">{product.sku || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-secondary-600">{product.category?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-secondary-900">{formatCurrency(Number(product.basePrice))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${totalStock === 0 ? 'text-red-600' : totalStock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link to={`/merchant/products/${product.id}/edit`} className="btn-secondary p-2">
                            <FiEdit2 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(product.id)} className="btn-danger p-2">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
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
    </motion.div>
  );
}
