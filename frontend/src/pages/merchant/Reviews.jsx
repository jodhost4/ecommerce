import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiChevronLeft, FiChevronRight, FiCheck, FiX, FiTrash2, FiStar, FiThumbsUp, FiMessageSquare, FiUser } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

const RATING_FILTERS = [0, 5, 4, 3, 2, 1];
const STATUS_FILTERS = ['ALL', 'APPROVED', 'PENDING', 'REJECTED'];

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [summary, setSummary] = useState({ total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [productFilter, setProductFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [page, ratingFilter, statusFilter, productFilter]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (ratingFilter > 0) params.rating = ratingFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter.toLowerCase();
      if (productFilter) params.productId = productFilter;
      const res = await api.get('/reviews', { params });
      const resData = res.data.data;
      // Handle both paginated and non-paginated responses
      const reviewList = resData?.reviews || resData || [];
      setReviews(Array.isArray(reviewList) ? reviewList : []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/reviews/merchant/summary');
      setSummary(res.data.data || { total: 0, average: 0, pending: 0, approved: 0, distribution: [] });
    } catch {
      // silently fail
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const isApproved = status === 'APPROVED';
      await api.put(`/reviews/${id}/moderate`, { isApproved });
      toast.success(`Review ${status.toLowerCase()}`);
      fetchReviews();
      fetchSummary();
    } catch {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
      fetchSummary();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-secondary-300'}`} />
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Reviews</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-secondary-500 mb-1">Total Reviews</p>
          <p className="text-2xl font-bold text-secondary-900">{summary.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-secondary-500 mb-1">Average Rating</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-secondary-900">{summary.average.toFixed(1)}</p>
            <div className="flex items-center space-x-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar key={star} className={`w-4 h-4 ${star <= Math.round(summary.average) ? 'text-yellow-400 fill-yellow-400' : 'text-secondary-300'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-secondary-500 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.pending || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-secondary-500 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{summary.approved || 0}</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input type="text" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchReviews())} className="input-field pl-10" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-secondary-500">Rating:</span>
            <div className="flex space-x-1">
              {RATING_FILTERS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRatingFilter(r); setPage(1); }}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${ratingFilter === r ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'}`}
                >
                  {r === 0 ? 'All' : `${r}★`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-secondary-500">Status:</span>
            <div className="flex space-x-1">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'}`}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Review</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12"><LoadingSpinner /></td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-secondary-500">No reviews found</td></tr>
              ) : (
                reviews.map((review, i) => (
                  <motion.tr key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                          {review.product?.images?.[0] ? (
                            <img src={review.product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-secondary-400"><FiMessageSquare className="w-4 h-4" /></div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-secondary-900 truncate max-w-[150px]">{review.product?.name || 'Unknown Product'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-secondary-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-3.5 h-3.5 text-secondary-500" />
                        </div>
                        <span className="text-sm text-secondary-700">{review.user?.firstName} {review.user?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{renderStars(review.rating)}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-secondary-700 truncate">{review.content || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-500 whitespace-nowrap">{review.createdAt ? formatDateTime(review.createdAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          review.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {review.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {review.status !== 'APPROVED' && (
                          <button onClick={() => handleStatus(review.id, 'APPROVED')} className="btn-secondary p-1.5 text-green-600" title="Approve"><FiCheck className="w-4 h-4" /></button>
                        )}
                        {review.status !== 'REJECTED' && (
                          <button onClick={() => handleStatus(review.id, 'REJECTED')} className="btn-secondary p-1.5 text-red-600" title="Reject"><FiX className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handleDelete(review.id)} className="btn-danger p-1.5"><FiTrash2 className="w-4 h-4" /></button>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="btn-secondary p-2 disabled:opacity-50"><FiChevronLeft className="w-4 h-4" /></button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-secondary-400">...</span>}
                    <button onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md ${p === pagination.page ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-200'}`}>{p}</button>
                  </span>
                ))}
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="btn-secondary p-2 disabled:opacity-50"><FiChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Rating Distribution</h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution?.[star] || 0;
            const maxCount = Math.max(...Object.values(summary.distribution || {}), 1);
            const percentage = (count / maxCount) * 100;
            return (
              <div key={star} className="flex items-center space-x-3">
                <span className="text-sm text-secondary-600 w-8 flex items-center space-x-1">
                  <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /><span>{star}</span>
                </span>
                <div className="flex-1 h-3 bg-secondary-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: (5 - star) * 0.1 }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <span className="text-sm text-secondary-600 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
