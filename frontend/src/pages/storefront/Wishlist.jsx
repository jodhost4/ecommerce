import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiTrash2, FiShare2, FiArrowLeft, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../components/layout/ThemeContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  const { storeId: urlStoreId } = useParams();
  const storeId = urlStoreId || 'default';

  useEffect(() => {
    api.get(`/stores/${storeId}/wishlist`).then((res) => {
      setItems(res.data.data || []);
    }).catch(() => {
      setItems([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await api.delete(`/stores/${storeId}/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => (item.product?.id || item.id) !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await api.post(`/stores/${storeId}/cart`, { productId, quantity: 1 });
      toast.success('Added to cart');
    } catch {
      toast.error('Please login to add items to cart');
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      await api.post(`/stores/${storeId}/cart`, { productId, quantity: 1 });
      await api.delete(`/stores/${storeId}/wishlist/${productId}`);
      setItems((prev) => prev.filter((item) => (item.product?.id || item.id) !== productId));
      toast.success('Moved to cart');
    } catch {
      toast.error('Failed to move item to cart');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Wishlist link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const { pageLayouts } = useTheme();
  const wishlistLayout = pageLayouts?.wishlist || {};
  const showShare = wishlistLayout.showShare !== false;
  const viewMode = wishlistLayout.viewMode || 'grid';

  if (loading) return <LoadingSpinner />;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiHeart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-8">Save your favorite items and come back to them later</p>
        <Link to={`/store/${storeId}/products`} className="btn-primary inline-flex items-center">
          <FiArrowLeft className="mr-2" /> Browse Products
        </Link>
      </div>
    );
  }

  const wishlistItems = items.map((item) => item.product || item);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        {showShare && (
          <button onClick={handleShare} className="btn-secondary">
            <FiShare2 className="w-4 h-4 mr-2" /> Share Wishlist
          </button>
        )}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={viewMode === 'list'
          ? 'space-y-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        }
      >
        {wishlistItems.map((product, i) => {
          const productId = product.id;
          const images = product.images || [];
          const imageUrl = images[0]?.url || 'https://placehold.co/400';
          const isRemoving = removing === productId;

          return (
            <motion.div
              key={productId}
              variants={itemVariants}
              className={`group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${isRemoving ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="relative">
                <Link to={`/store/${storeId}/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>

                <button
                  onClick={() => handleRemove(productId)}
                  disabled={isRemoving}
                  className="absolute top-3 right-3 p-2.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors text-red-500"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <Link to={`/store/${storeId}/products/${product.slug}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors truncate">{product.name}</h3>
                </Link>

                {product.category && (
                  <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
                )}

                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiHeart
                      key={star}
                      className={`w-3 h-3 ${star <= Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">({product.reviewCount || 0})</span>
                </div>

                <p className="text-lg font-bold text-primary-600 mt-2">${(product.basePrice || product.price || 0).toFixed(2)}</p>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleAddToCart(productId)}
                    disabled={isRemoving}
                    className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-50"
                  >
                    <FiShoppingCart className="w-4 h-4 mr-1.5 inline" /> Add to Cart
                  </button>
                  <button
                    onClick={() => handleMoveToCart(productId)}
                    disabled={isRemoving}
                    className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                    title="Move to cart"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
