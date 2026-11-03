import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowRight, FiShoppingBag, FiStar, FiChevronRight, FiChevronLeft,
  FiMail, FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiTag, FiPercent
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TRUST_BADGES = [
  { icon: FiTruck, title: 'Free Shipping', desc: 'On orders over ₹500' },
  { icon: FiShield, title: 'Secure Payment', desc: '100% safe checkout' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: FiHeadphones, title: '24/7 Support', desc: 'Always here to help' },
];

export default function Home() {
  const { storeId: urlStoreId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    if (!urlStoreId) return;
    api.get(`/stores/${urlStoreId}/home`)
      .then((res) => setData(res.data.data))
      .catch(() => {
        setData({
          store: { name: 'Demo Store', description: 'Welcome to our store' },
          banners: [{
            id: 1,
            title: 'Welcome to Our Store',
            subtitle: 'Discover amazing products at great prices',
            imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop',
            link: `/store/${urlStoreId}/products`,
            buttonText: 'Shop Now'
          }],
          featuredProducts: [],
          categories: [],
        });
      })
      .finally(() => setLoading(false));
  }, [urlStoreId]);

  const banners = data?.banners || [];

  const nextBanner = useCallback(() => {
    setBannerIndex((i) => (i + 1) % Math.max(banners.length, 1));
  }, [banners.length]);

  const prevBanner = () => setBannerIndex((i) => (i - 1 + Math.max(banners.length, 1)) % Math.max(banners.length, 1));

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextBanner]);

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(productId);
    try {
      await api.post(`/stores/${urlStoreId}/cart`, { productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch {
      toast.error('Please sign in to add items to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) { toast.success('Subscribed! Thank you.'); setEmail(''); }
  };

  if (loading) return <LoadingSpinner />;

  const homepageSections = data?.store?.theme?.homepage?.sections || [];
  const { featuredProducts = [], categories = [], trendingProducts = [], activeOffers = [] } = data || {};
  const activeBanner = banners[bannerIndex];

  const renderSection = (section) => {
    switch (section.type) {
      case 'hero':
        return null;

      case 'featured-products':
        if (featuredProducts.length === 0) return null;
        return (
          <section className="py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-primary-600 text-sm font-semibold mb-1">{section.content || 'Handpicked for you'}</p>
                  <h2 className="text-3xl font-bold text-gray-900">{section.title || 'Featured Products'}</h2>
                </div>
                <Link to={`/store/${urlStoreId}/products`} className="hidden md:flex items-center text-primary-600 font-medium text-sm">
                  View All <FiChevronRight className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {featuredProducts.slice(0, 8).map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group relative">
                    <Link to={`/store/${urlStoreId}/products/${product.slug}`} className="block">
                      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3 relative">
                        <img src={product.images?.[0]?.url || 'https://placehold.co/400'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.preventDefault(); handleAddToCart(product.id, e); }} disabled={addingToCart === product.id}
                            className="w-full py-2 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-primary-600 hover:text-white transition-colors shadow-lg">
                            {addingToCart === product.id ? 'Adding...' : 'Quick Add'}
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm truncate">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500">{Number(product.averageRating || 4.5).toFixed(1)}</span>
                      </div>
                      <p className="text-base font-bold text-primary-600 mt-1">₹{Number(product.basePrice || 0).toFixed(2)}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'featured-categories':
        if (categories.length === 0) return null;
        return (
          <section className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-primary-600 text-sm font-semibold mb-1">{section.content || 'Explore'}</p>
                  <h2 className="text-3xl font-bold text-gray-900">{section.title || 'Shop by Category'}</h2>
                </div>
                <Link to={`/store/${urlStoreId}/categories`} className="hidden md:flex items-center text-primary-600 font-medium text-sm">
                  All Categories <FiChevronRight className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {categories.slice(0, 12).map((cat, i) => (
                    <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/store/${urlStoreId}/products?category=${cat.id}`} className="group block p-5 bg-white rounded-2xl border border-gray-200 text-center hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                      <div className="w-14 h-14 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                        <FiShoppingBag className="w-6 h-6 text-primary-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{cat._count?.products || 0} items</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'trending-products':
        if (trendingProducts.length === 0) return null;
        return (
          <section className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-orange-500 text-sm font-semibold mb-1">{section.content || '🔥 Hot Right Now'}</p>
                  <h2 className="text-3xl font-bold text-gray-900">{section.title || 'Trending Products'}</h2>
                </div>
                <Link to={`/store/${urlStoreId}/products?sort=popular`} className="hidden md:flex items-center text-primary-600 font-medium text-sm">
                  View All <FiChevronRight className="ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {trendingProducts.slice(0, 4).map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                    <Link to={`/store/${urlStoreId}/products/${product.slug}`}
                      className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all group">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={product.images?.[0]?.url || 'https://placehold.co/200'} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full mb-1">#{i + 1} Trending</span>
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <FiStar key={s} className={`w-3 h-3 ${s <= Math.round(product.averageRating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-primary-600 font-bold text-sm mt-1">₹{Number(product.basePrice || 0).toFixed(2)}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'promo-banner':
        return (
          <section className="py-10 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center px-8"
                style={section.imageUrl ? { backgroundImage: `url(${section.imageUrl})`, backgroundSize: 'cover' } : {}}
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mt-1 mb-3">{section.title || 'Special Offer'}</h3>
                  <p className="text-primary-200 text-sm mb-3">{section.content}</p>
                  <Link to={section.link || `/store/${urlStoreId}/products`}
                    className="inline-flex items-center px-5 py-2 bg-white text-primary-700 font-semibold text-sm rounded-xl hover:bg-primary-50 transition-colors">
                    {section.buttonText || 'Shop Now'} <FiArrowRight className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        );

      case 'offer-banner':
        return (
          <section className="py-10 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center px-8"
                style={section.imageUrl ? { backgroundImage: `url(${section.imageUrl})`, backgroundSize: 'cover' } : {}}
              >
                <div className="relative z-10">
                  {section.discountPercentage && (
                    <span className="text-orange-200 text-sm font-medium">Up to {section.discountPercentage}% Off</span>
                  )}
                  <h3 className="text-2xl font-bold text-white mt-1 mb-3">{section.title || 'Limited Time Offer'}</h3>
                  <p className="text-orange-100 text-sm mb-3">{section.content}</p>
                  <div className="flex items-center gap-3">
                    <Link to={section.link || `/store/${urlStoreId}/products`}
                      className="inline-flex items-center px-5 py-2 bg-white text-orange-700 font-semibold text-sm rounded-xl hover:bg-orange-50 transition-colors">
                      {section.buttonText || 'Shop Now'} <FiArrowRight className="ml-1" />
                    </Link>
                    {section.couponCode && (
                      <span className="px-3 py-1.5 bg-white/20 text-white text-sm font-mono rounded-lg backdrop-blur-sm">
                        Use: {section.couponCode}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        );

      case 'newsletter':
        return (
          <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <FiMail className="w-12 h-12 text-white mx-auto mb-4 opacity-80" />
                <h2 className="text-3xl font-bold text-white mb-3">{section.title || 'Stay in the Loop'}</h2>
                <p className="text-primary-100 mb-8">{section.content || 'Subscribe for exclusive deals, new arrivals and updates.'}</p>
                <form onSubmit={handleNewsletter} className="flex max-w-md mx-auto gap-2">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
                    className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50" />
                  <button type="submit" className="px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">
                    Subscribe
                  </button>
                </form>
              </motion.div>
            </div>
          </section>
        );

      case 'categories':
      case 'categories-list':
        if (categories.length === 0) return null;
        return (
          <section className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{section.title || 'Categories'}</h2>
                  <p className="text-secondary-500 text-sm mt-1">{section.content}</p>
                </div>
              </div>
              <div className={section.type === 'categories-list'
                ? 'space-y-2 max-w-2xl'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
              }>
                {categories.slice(0, 12).map((cat) => (
                  <Link key={cat.id} to={`/store/${urlStoreId}/products?category=${cat.id}`}
                    className={section.type === 'categories-list'
                      ? 'block p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors text-sm font-medium text-gray-700 hover:text-primary-600'
                      : 'group block p-5 bg-white rounded-2xl border border-gray-200 text-center hover:border-primary-300 hover:shadow-lg transition-all'
                    }>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{cat._count?.products || 0} items</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO BANNER CAROUSEL ── */}
      <section className="relative h-[480px] md:h-[580px] bg-gray-900 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeBanner && (
            <motion.div
              key={bannerIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img
                src={activeBanner.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop'}
                alt={activeBanner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24"
              >
                <div className="max-w-xl">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-medium rounded-full mb-4 backdrop-blur-sm">
                    ✨ New Collection
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    {activeBanner.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-200 mb-8">{activeBanner.subtitle}</p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={activeBanner.link?.startsWith('/store/') ? activeBanner.link : `/store/${urlStoreId}/products`}
                      className="inline-flex items-center px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                    >
                      {activeBanner.buttonText || 'Shop Now'} <FiArrowRight className="ml-2" />
                    </Link>
                    <Link
                      to={`/store/${urlStoreId}/categories`}
                      className="inline-flex items-center px-8 py-3.5 border-2 border-white/60 text-white font-semibold rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm"
                    >
                      Browse Categories
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {banners.length > 1 && (
          <>
            <button onClick={prevBanner} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-sm">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextBanner} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-sm">
              <FiChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${i === bannerIndex ? 'bg-white w-8' : 'bg-white/40 w-2.5'}`} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DYNAMIC SECTIONS (from Store Design) ── */}
      {homepageSections.length > 0 ? (
        homepageSections.filter(s => s.isActive !== false).map((section, i) => (
          <motion.div key={section.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            {renderSection(section)}
          </motion.div>
        ))
      ) : (
        <>
          {/* ── CATEGORIES (fallback) ── */}
          {categories.length > 0 && (
            <section className="py-14 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-primary-600 text-sm font-semibold mb-1">Explore</p>
                    <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
                  </div>
                  <Link to={`/store/${urlStoreId}/categories`} className="hidden md:flex items-center text-primary-600 font-medium text-sm">
                    All Categories <FiChevronRight className="ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {categories.slice(0, 12).map((cat, i) => (
                    <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/store/${urlStoreId}/products?category=${cat.id}`}
                        className="group block p-5 bg-white rounded-2xl border border-gray-200 text-center hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                        <div className="w-14 h-14 bg-primary-50 group-hover:bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                          <FiShoppingBag className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{cat._count?.products || 0} items</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── FEATURED PRODUCTS (fallback) ── */}
          {featuredProducts.length > 0 && (
            <section className="py-14 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-primary-600 text-sm font-semibold mb-1">Handpicked for you</p>
                    <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                  </div>
                  <Link to={`/store/${urlStoreId}/products`} className="hidden md:flex items-center text-primary-600 font-medium text-sm">
                    View All <FiChevronRight className="ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {featuredProducts.slice(0, 8).map((product, i) => (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      className="group relative">
                      <Link to={`/store/${urlStoreId}/products/${product.slug}`} className="block">
                        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3 relative">
                          <img src={product.images?.[0]?.url || 'https://placehold.co/400'} alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleAddToCart(product.id, e)} disabled={addingToCart === product.id}
                              className="w-full py-2 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-primary-600 hover:text-white transition-colors shadow-lg">
                              {addingToCart === product.id ? 'Adding...' : 'Quick Add'}
                            </button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm truncate">{product.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{Number(product.averageRating || 4.5).toFixed(1)}</span>
                        </div>
                        <p className="text-base font-bold text-primary-600 mt-1">₹{Number(product.basePrice || 0).toFixed(2)}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── PROMO OFFER BANNERS (fallback) ── */}
          <section className="py-10 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-5">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center px-8">
                  <div className="absolute right-0 top-0 opacity-10"><FiPercent className="w-48 h-48 text-white" /></div>
                  <div className="relative z-10">
                    <span className="text-primary-200 text-sm font-medium">Limited Time Offer</span>
                    <h3 className="text-2xl font-bold text-white mt-1 mb-3">Up to 30% Off<br />New Arrivals</h3>
                    <Link to={`/store/${urlStoreId}/products?sort=newest`}
                      className="inline-flex items-center px-5 py-2 bg-white text-primary-700 font-semibold text-sm rounded-xl hover:bg-primary-50 transition-colors">
                      Shop Now <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center px-8">
                  <div className="absolute right-0 top-0 opacity-10"><FiTag className="w-48 h-48 text-white" /></div>
                  <div className="relative z-10">
                    <span className="text-orange-200 text-sm font-medium">Best Deals</span>
                    <h3 className="text-2xl font-bold text-white mt-1 mb-3">Flash Sale<br />This Week Only</h3>
                    <Link to={`/store/${urlStoreId}/products?sort=popular`}
                      className="inline-flex items-center px-5 py-2 bg-white text-orange-700 font-semibold text-sm rounded-xl hover:bg-orange-50 transition-colors">
                      Explore <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── TRENDING PRODUCTS (fallback) ── */}
          {featuredProducts.length > 0 && (
            <section className="py-14 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-orange-500 text-sm font-semibold mb-1">🔥 Hot Right Now</p>
                    <h2 className="text-3xl font-bold text-gray-900">Trending Products</h2>
                  </div>
                  <Link to={`/store/${urlStoreId}/products?sort=popular`} className="hidden md:flex items-center text-primary-600 font-medium text-sm">
                    View All <FiChevronRight className="ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {featuredProducts.slice(0, 4).map((product, i) => (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                      <Link to={`/store/${urlStoreId}/products/${product.slug}`}
                        className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all group">
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={product.images?.[0]?.url || 'https://placehold.co/200'} alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full mb-1">#{i + 1} Trending</span>
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <FiStar key={s} className={`w-3 h-3 ${s <= Math.round(product.averageRating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <p className="text-primary-600 font-bold text-sm mt-1">₹{Number(product.basePrice || 0).toFixed(2)}</p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── ABOUT STORE (fallback) ── */}
          {data?.store?.description && (
            <section className="py-14 bg-white border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1">
                    <p className="text-primary-600 text-sm font-semibold mb-2">Our Story</p>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">About {data.store.name}</h2>
                    <p className="text-gray-600 text-lg leading-relaxed">{data.store.description}</p>
                    <Link to={`/store/${urlStoreId}/about`} className="inline-flex items-center mt-6 text-primary-600 hover:text-primary-700 font-medium">
                      Learn More <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                  {data.store.logo && (
                    <div className="flex-shrink-0 w-48 h-48 bg-gray-50 rounded-3xl p-8 flex items-center justify-center border border-gray-100 shadow-sm">
                      <img src={data.store.logo} alt={data.store.name} className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── NEWSLETTER (fallback) ── */}
          <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-800">
            <div className="max-w-2xl mx-auto px-4 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <FiMail className="w-12 h-12 text-white mx-auto mb-4 opacity-80" />
                <h2 className="text-3xl font-bold text-white mb-3">Stay in the Loop</h2>
                <p className="text-primary-100 mb-8">Subscribe for exclusive deals, new arrivals and updates.</p>
                <form onSubmit={handleNewsletter} className="flex max-w-md mx-auto gap-2">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
                    className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50" />
                  <button type="submit" className="px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap">
                    Subscribe
                  </button>
                </form>
              </motion.div>
            </div>
          </section>
        </>
      )}

    </div>
  );
}
