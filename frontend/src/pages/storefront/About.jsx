import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiTarget, FiEye, FiHeart, FiStar, FiShield, FiSmile } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function About() {
  const { storeId } = useParams();
  const [page, setPage] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, storeRes] = await Promise.all([
          api.get(`/cms/pages/slug/about?storeId=${storeId}`).catch(() => ({ data: { data: null } })),
          api.get(`/stores/${storeId}`).catch(() => ({ data: { data: null } }))
        ]);
        setPage(pageRes.data.data);
        setStore(storeRes.data.data);
      } catch (error) {
        console.error('Failed to fetch About page', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-secondary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl -ml-48 -mb-48" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <Link to={`/store/${storeId}/home`} className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-8 transition-colors">
            <FiChevronLeft className="mr-2" /> Back to Store
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            About {store?.name || 'Our Store'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-secondary-300 max-w-3xl mx-auto leading-relaxed"
          >
            {store?.description || 'Your trusted partner for quality products and exceptional shopping experience.'}
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          {page ? (
            <div className="prose prose-lg max-w-none prose-headings:text-secondary-900 prose-p:text-secondary-600 prose-a:text-primary-600">
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            </div>
          ) : (
            <div className="space-y-20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-secondary-900 mb-6">Our Story</h2>
                  <p className="text-lg text-secondary-600 leading-relaxed mb-6">
                    Founded with a passion for excellence, {store?.name || 'our store'} started with a simple idea: to make quality products accessible to everyone. We believe that shopping should be enjoyable, transparent, and rewarding.
                  </p>
                  <p className="text-lg text-secondary-600 leading-relaxed">
                    Over the years, we have grown from a small family business into a leading destination for {store?.name || 'online'} shoppers, always maintaining our commitment to personalized service and community values.
                  </p>
                </div>
                <div className="bg-secondary-50 rounded-3xl p-8 flex items-center justify-center border-2 border-secondary-100 aspect-square">
                  {store?.logo ? (
                    <img src={store.logo} alt={store.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <FiStar className="w-32 h-32 text-primary-500 opacity-20" />
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 bg-white border border-secondary-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                    <FiTarget className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-4">Our Mission</h3>
                  <p className="text-secondary-600">To deliver curated quality products that inspire and simplify the lives of our customers worldwide.</p>
                </div>
                <div className="p-8 bg-white border border-secondary-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                    <FiEye className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-4">Our Vision</h3>
                  <p className="text-secondary-600">To become the world's most customer-centric destination for discovering unique and sustainable products.</p>
                </div>
                <div className="p-8 bg-white border border-secondary-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                    <FiHeart className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-4">Our Values</h3>
                  <p className="text-secondary-600">Built on trust, innovation, and an unwavering commitment to quality and ethical business practices.</p>
                </div>
              </div>

              <div className="bg-primary-50 rounded-3xl p-12 text-center">
                <h2 className="text-3xl font-bold text-secondary-900 mb-4">Quality You Can Trust</h2>
                <p className="text-lg text-secondary-600 max-w-2xl mx-auto mb-10">
                  We verify every product and partner to ensure you only get the very best. Your satisfaction is our top priority.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex flex-col items-center">
                    <FiShield className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-semibold">100% Secure</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FiStar className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-semibold">Premium Quality</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FiSmile className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-semibold">Happy Clients</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FiTarget className="w-8 h-8 text-primary-600 mb-2" />
                    <span className="text-sm font-semibold">Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

