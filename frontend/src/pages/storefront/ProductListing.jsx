import { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGrid, FiList, FiFilter, FiSearch, FiStar, FiShoppingCart, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../components/layout/ThemeContext';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name_asc', label: 'Name: A-Z' },
];

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const { pageLayouts } = useTheme();
  const shopLayout = pageLayouts?.shop || {};
  const showFilters = shopLayout.showFilters !== false;
  const showSort = shopLayout.showSort !== false;
  const defaultView = shopLayout.viewMode || 'grid';
  const showSidebar = shopLayout.sidebar !== false;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(defaultView);

  const { storeId: urlStoreId } = useParams();
  const storeId = urlStoreId || 'default';
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [localSearch, setLocalSearch] = useState(search);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setLocalSearch(search);
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [search, minPrice, maxPrice]);

  useEffect(() => {
    api.get(`/stores/${storeId}/categories`).then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('page', page);

    api.get(`/stores/${storeId}/products?${params}`).then((res) => {
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    }).catch(() => {
      setProducts([]);
    }).finally(() => setLoading(false));
  }, [search, categoryId, sort, minPrice, maxPrice, page]);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (updates.page === undefined) params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: localSearch });
  };

  const handleAddToCart = async (productId) => {
    try {
      await api.post(`/stores/${storeId}/cart`, { productId, quantity: 1 });
      toast.success('Added to cart');
    } catch {
      toast.error('Please login to add items to cart');
    }
  };

  const clearFilters = () => {
    setLocalSearch('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setSearchParams({});
  };

  const hasFilters = search || categoryId || minPrice || maxPrice || sort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>
        </div>
        <div className="flex items-center gap-3">
          {showFilters && (
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-secondary">
              <FiFilter className="w-4 h-4 mr-2" /> Filters
            </button>
          )}
          <div className="hidden sm:flex border border-gray-300 rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}>
              <FiGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}>
              <FiList className="w-4 h-4" />
            </button>
          </div>
          {showSort && (
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="input-field w-auto"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {search && (
            <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
              Search: {search} <button onClick={() => updateParams({ search: '' })}><FiX className="ml-1 w-3 h-3" /></button>
            </span>
          )}
          {categoryId && (
            <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
              Category <button onClick={() => updateParams({ category: '' })}><FiX className="ml-1 w-3 h-3" /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
              Price: ${minPrice || '0'} - ${maxPrice || '∞'} <button onClick={() => { setLocalMinPrice(''); setLocalMaxPrice(''); updateParams({ minPrice: '', maxPrice: '' }); }}><FiX className="ml-1 w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700">Clear all</button>
        </div>
      )}

      <div className="flex gap-8">
        {showSidebar && (
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search products..."
                  className="input-field pl-10"
                />
              </div>
            </form>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateParams({ category: '' })}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!categoryId ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <button
                      onClick={() => updateParams({ category: cat.id })}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${categoryId === cat.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {cat.name} ({cat._count?.products || 0})
                    </button>
                    {cat.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => updateParams({ category: child.id })}
                        className={`block w-full text-left pl-8 pr-3 py-1.5 text-sm rounded-lg transition-colors ${categoryId === child.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={localMinPrice}
                  onChange={(e) => setLocalMinPrice(e.target.value)}
                  placeholder="Min"
                  className="input-field w-full"
                  min="0"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="input-field w-full"
                  min="0"
                />
              </div>
              <button
                onClick={() => updateParams({ minPrice: localMinPrice, maxPrice: localMaxPrice })}
                className="btn-primary w-full mt-2 text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </aside>
        )}

        {sidebarOpen && showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 h-full w-72 bg-white p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">Filters</h2>
                <button onClick={() => setSidebarOpen(false)}><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6">{/* Same filter content as desktop */}</div>
            </motion.aside>
          </div>
        )}

        <main className="flex-1">
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <FiSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={viewMode === 'grid' ? 'group' : 'flex gap-4 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow'}
                  >
                    <Link to={`/store/${storeId}/products/${product.slug}`} className={viewMode === 'grid' ? 'block' : 'flex-shrink-0'}>
                      <div className={`${viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32'} bg-gray-100 rounded-xl overflow-hidden`}>
                        <img
                          src={product.images?.[0]?.url || 'https://placehold.co/400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                    <div className={viewMode === 'grid' ? 'mt-3' : 'flex-1 flex flex-col justify-between'}>
                      <div>
                        <Link to={`/store/${storeId}/products/${product.slug}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">{product.name}</h3>
                        </Link>
                        {product.category && (
                          <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{product.averageRating || '0.0'}</span>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mt-3' : 'mt-2'}`}>
                        <span className="text-lg font-bold text-primary-600">${product.price?.toFixed(2)}</span>
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <FiShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => updateParams({ page: page - 1 })}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParams({ page: p })}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        p === page ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => updateParams({ page: page + 1 })}
                    disabled={page >= pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
