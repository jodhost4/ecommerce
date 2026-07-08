import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiStar, FiShoppingCart, FiChevronLeft, FiChevronRight, FiX, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

const PRICE_RANGES = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: null },
];

const RATING_FILTERS = [4, 3, 2, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const storeId = 'default';
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const brand = searchParams.get('brand') || '';
  const rating = searchParams.get('rating') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    Promise.all([
      api.get(`/stores/${storeId}/categories`),
      api.get(`/stores/${storeId}/brands`),
    ]).then(([catRes, brandRes]) => {
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (brand) params.set('brand', brand);
    if (rating) params.set('minRating', rating);
    params.set('page', page);

    api.get(`/stores/${storeId}/products?${params}`).then((res) => {
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    }).catch(() => {
      setProducts([]);
    }).finally(() => setLoading(false));
  }, [search, categoryId, sort, minPrice, maxPrice, brand, rating, page]);

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
    setSearchParams({});
  };

  const hasFilters = search || categoryId || minPrice || maxPrice || brand || rating || sort !== 'newest';

  const ActiveFilters = () => (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {search && (
        <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
          Search: {search} <button onClick={() => updateParams({ search: '' })}><FiX className="ml-1 w-3 h-3" /></button>
        </span>
      )}
      {rating && (
        <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
          {rating}+ stars <button onClick={() => updateParams({ rating: '' })}><FiX className="ml-1 w-3 h-3" /></button>
        </span>
      )}
      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">
          Price: ${minPrice || '0'} - ${maxPrice || '∞'} <button onClick={() => updateParams({ minPrice: '', maxPrice: '' })}><FiX className="ml-1 w-3 h-3" /></button>
        </span>
      )}
      <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700">Clear all</button>
    </div>
  );

  const FilterSidebar = () => (
    <div className="space-y-6">
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
            <button
              key={cat.id}
              onClick={() => updateParams({ category: cat.id })}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${categoryId === cat.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.name} ({cat._count?.products || 0})
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => updateParams({ minPrice: range.min, maxPrice: range.max || '' })}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                minPrice === String(range.min) && maxPrice === String(range.max || '')
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
          <div className="flex gap-2 items-center pt-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => updateParams({ minPrice: e.target.value })}
              placeholder="Min"
              className="input-field w-full"
              min="0"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => updateParams({ maxPrice: e.target.value })}
              placeholder="Max"
              className="input-field w-full"
              min="0"
            />
          </div>
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Brands</h3>
          <div className="space-y-1">
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => updateParams({ brand: brand === b.id ? '' : b.id })}
                className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${brand === b.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Rating</h3>
        <div className="space-y-1">
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => updateParams({ rating: rating === String(r) ? '' : r })}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${rating === String(r) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar key={s} className={`w-3.5 h-3.5 ${s <= r ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              & up
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
          <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-secondary">
            <FiFilter className="w-4 h-4 mr-2" /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="input-field w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && <ActiveFilters />}

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FilterSidebar />
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute left-0 top-0 h-full w-72 bg-white p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2"><FiSliders className="w-4 h-4" /> Filters</h2>
                <button onClick={() => setSidebarOpen(false)}><FiX className="w-5 h-5" /></button>
              </div>
              <FilterSidebar />
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
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {products.map((product) => (
                  <motion.div key={product.id} variants={itemVariants} className="group">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                      <Link to={`/products/${product.slug}`}>
                        <img
                          src={product.images?.[0]?.url || 'https://placehold.co/400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className="absolute bottom-2 right-2 p-2.5 bg-white rounded-full shadow-lg hover:bg-primary-600 hover:text-white transition-colors text-gray-700"
                      >
                        <FiShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{product.averageRating || '0.0'}</span>
                    </div>
                    <p className="text-lg font-bold text-primary-600 mt-1">${product.price?.toFixed(2)}</p>
                  </motion.div>
                ))}
              </motion.div>

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
