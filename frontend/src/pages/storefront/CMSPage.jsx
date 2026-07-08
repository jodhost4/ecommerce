import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CMSPage() {
  const { storeId, slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/stores/${storeId}/page/${slug}`);
        setPage(res.data.data);
      } catch (error) {
        console.error('Failed to fetch CMS page', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [storeId, slug]);

  if (loading) return <LoadingSpinner />;

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">Page Not Found</h1>
        <p className="text-secondary-600">The page you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-4xl mx-auto px-4 py-16"
    >
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-secondary-900 mb-8">{page.title}</h1>
        <div 
          className="cms-content"
          dangerouslySetInnerHTML={{ __html: page.content }} 
        />
      </div>
    </motion.div>
  );
}
