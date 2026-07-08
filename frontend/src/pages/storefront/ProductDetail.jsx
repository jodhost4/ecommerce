import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiShare2, FiStar, FiChevronLeft, FiChevronRight, FiMinus, FiPlus, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTheme } from '../../components/layout/ThemeContext';

export default function ProductDetail() {
  const { storeId: urlStoreId, slug } = useParams();
  const storeId = urlStoreId || 'default';
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);


  useEffect(() => {
    setLoading(true);
    api.get(`/stores/${storeId}/products/${slug}`).then((res) => {
      setProduct(res.data.data);
      setSelectedImage(0);
      setQuantity(1);
    }).catch(() => {
      setProduct(null);
    }).finally(() => setLoading(false));

  }, [slug]);

  useEffect(() => {
    if (!product?.id) return;
    api.get(`/stores/${storeId}/wishlist`).then(res => {
      const wishlistItems = res.data.data || [];
      const found = wishlistItems.some(item => (item.product?.id || item.id) === product.id);
      setInWishlist(found);
    }).catch(() => {});
  }, [product?.id]);

  const handleAddToCart = async () => {
    try {
      await api.post(`/stores/${storeId}/cart`, {
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
      });
      toast.success('Added to cart');
    } catch {
      toast.error('Please login to add items to cart');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (inWishlist) {
        await api.delete(`/stores/${storeId}/wishlist/${product.id}`);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/stores/${storeId}/wishlist`, { productId: product.id });
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Please login to manage wishlist');
    }
  };

  const { pageLayouts } = useTheme();
  const productLayout = pageLayouts?.['product-detail'] || {};
  const showReviews = productLayout.showReviews !== false;
  const showRelated = productLayout.showRelated !== false;
  const showVariants = productLayout.showVariants !== false;
  const galleryStyle = productLayout.galleryStyle || 'stacked';

  const variantOptions = product?.variants?.reduce((acc, v) => {
    if (v.option1Name) {
      if (!acc[v.option1Name]) acc[v.option1Name] = new Set();
      acc[v.option1Name].add(v.option1Value);
    }
    if (v.option2Name) {
      if (!acc[v.option2Name]) acc[v.option2Name] = new Set();
      acc[v.option2Name].add(v.option2Value);
    }
    return acc;
  }, {}) || {};

  if (loading) return <LoadingSpinner />;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      <Link to={`/store/${storeId}/products`} className="btn-primary mt-4 inline-block">Back to Products</Link>
    </div>
  );

  const images = product.images?.length ? product.images : [{ url: 'https://placehold.co/600' }];
  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to={`/store/${storeId}/home`} className="hover:text-primary-600">Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/store/${storeId}/categories/${product.category.slug}`} className="hover:text-primary-600">{product.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
            <img
              src={images[selectedImage]?.url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((i) => Math.max(0, i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage((i) => Math.min(images.length - 1, i + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selectedImage ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {product.sku && <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount || 0} reviews)</span>
          </div>

          <div className="text-3xl font-bold text-primary-600 mb-6">${currentPrice?.toFixed(2)}</div>

          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

          {showVariants && Object.entries(variantOptions).map(([name, values]) => (
            <div key={name} className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">{name}</label>
              <div className="flex flex-wrap gap-2">
                {[...values].map((value) => (
                  <button
                    key={value}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      selectedVariant?.option1Value === value || selectedVariant?.option2Value === value
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    onClick={() => {
                      const v = product.variants.find((v) => v.option1Value === value || v.option2Value === value);
                      if (v) setSelectedVariant(v);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <FiPlus className="w-4 h-4" />
              </button>
              <span className={`text-sm ml-2 ${currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className="flex-1 btn-primary py-3 text-base"
            >
              <FiShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`p-3 rounded-lg border transition-colors ${
                inWishlist ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <FiHeart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
            <button className="p-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600">
              <FiShare2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showReviews && product.reviews?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="space-y-4 max-w-2xl">
            {product.reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                      </span>
                    </div>
                    <span className="font-medium text-sm text-gray-900">
                      {review.user?.firstName} {review.user?.lastName}
                    </span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {showRelated && product.related?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {product.related.map((rp) => (
              <Link key={rp.id} to={`/store/${storeId}/products/${rp.slug}`} className="group">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                  <img src={rp.images?.[0]?.url || 'https://placehold.co/400'} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{rp.name}</h3>
                <p className="text-primary-600 font-bold mt-1">${rp.price?.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
