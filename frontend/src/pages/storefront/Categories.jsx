import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiChevronRight, FiTag } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Categories() {
  const { storeId } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/stores/${storeId}/categories`).then((res) => {
      setCategories(res.data.data || []);
    }).catch(() => {
      setCategories([]);
    }).finally(() => setLoading(false));
  }, [storeId]);

  const parentCategories = categories.filter((cat) => !cat.parentId);
  const subcategories = categories.filter((cat) => cat.parentId);

  const featured = parentCategories.slice(0, 4);

  if (loading) return <LoadingSpinner />;

  if (categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiTag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No categories yet</h2>
        <p className="text-gray-500 mb-4">Categories will appear here once they are added</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">Browse products by category</p>
      </div>

      {featured.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Featured Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((cat, i) => {
              const count = cat._count?.products || 0;
              const bgColors = ['from-primary-500 to-primary-700', 'from-secondary-500 to-secondary-700', 'from-amber-500 to-amber-700', 'from-emerald-500 to-emerald-700'];
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/store/${storeId}/products?category=${cat.id}`}
                    className={`block p-8 rounded-2xl bg-gradient-to-br ${bgColors[i % bgColors.length]} text-white relative overflow-hidden group`}
                  >
                    <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
                    <h3 className="text-2xl font-bold mb-2 relative">{cat.name}</h3>
                    <p className="text-white/80 mb-4 relative">{count} product{count !== 1 ? 's' : ''}</p>
                    <span className="inline-flex items-center text-sm font-medium text-white/90 group-hover:gap-2 transition-all relative">
                      Browse <FiChevronRight className="ml-1" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Categories</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
        >
          {parentCategories.map((cat) => {
            const childCats = subcategories.filter((c) => c.parentId === cat.id);
            return (
              <motion.div key={cat.id} variants={itemVariants}>
                <Link
                  to={`/store/${storeId}/products?category=${cat.id}`}
                  className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md hover:border-primary-300 transition-all group"
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors">
                    <FiShoppingBag className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat._count?.products || 0} products</p>
                  {childCats.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{childCats.length} subcategories</p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {subcategories.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Subcategories</h2>
          <div className="flex flex-wrap gap-3">
            {subcategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/store/${storeId}/products?category=${cat.id}`}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all"
              >
                {cat.name}
                {cat._count?.products > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400">({cat._count.products})</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
