import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiChevronRight, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const { storeId: urlStoreId } = useParams();
  const storeId = urlStoreId || 'default';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: pagination.page });
    if (statusFilter) params.set('status', statusFilter);

    api.get(`/stores/${storeId}/orders?${params}`).then((res) => {
      setOrders(res.data.data);
      setPagination((prev) => ({ ...prev, ...res.data.pagination }));
    }).catch(() => {
      setOrders([]);
    }).finally(() => setLoading(false));
  }, [storeId, pagination.page, statusFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
          className="input-field w-auto"
        >
          <option value="">All Orders</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
          <Link to={`/store/${storeId}/products`} className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/store/${storeId}/orders/${order.orderNumber}`} className="block p-4 rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{(order.orderItems || order.items)?.length || 0} items</span>
                    <span className="text-lg font-bold text-gray-900">₹{Number(order.total).toFixed(2)}</span>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                p === pagination.page ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
