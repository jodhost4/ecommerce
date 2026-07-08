import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUsers, FiBox, FiDollarSign, FiShoppingCart, FiTrendingUp, FiTrendingDown, FiClock, FiExternalLink, FiCopy } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
  REFUNDED: 'bg-pink-100 text-pink-800',
};

const StatCard = ({ label, value, icon: Icon, color, growth, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6"
  >
    {loading ? (
      <LoadingSpinner size="sm" />
    ) : (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? <FiTrendingUp className="w-4 h-4 mr-1" /> : <FiTrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(growth)}%
            </div>
          )}
        </div>
        <p className="text-sm text-secondary-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-secondary-900">{value}</p>
      </>
    )}
  </motion.div>
);

export default function MerchantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    if (user && !user.ownedStore) {
      navigate('/merchant/setup');
      return;
    }
    fetchDashboardData();
  }, [period, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, ordersRes, productsRes, customersRes] = await Promise.all([
        api.get('/merchant/dashboard/stats'),
        api.get(`/merchant/dashboard/revenue-chart?period=${period}`),
        api.get('/merchant/dashboard/recent-orders'),
        api.get('/merchant/dashboard/top-products'),
        api.get('/merchant/dashboard/recent-customers'),
      ]);

      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data.data);
      setRecentOrders(ordersRes.data.data);
      setTopProducts(productsRes.data.data);
      setRecentCustomers(customersRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const statCards = stats
    ? [
        { label: 'Revenue', value: formatCurrency(stats.revenue.total), icon: FiDollarSign, color: 'bg-green-500', growth: stats.growth.percentage },
        { label: 'Orders', value: stats.orders.total.toLocaleString(), icon: FiShoppingCart, color: 'bg-blue-500' },
        { label: 'Products', value: stats.products.total.toLocaleString(), icon: FiBox, color: 'bg-purple-500' },
        { label: 'Customers', value: stats.customers.total.toLocaleString(), icon: FiUsers, color: 'bg-orange-500' },
      ]
    : [];

  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(user?.ownedStore?.isActive ?? false);

  const handlePublish = async () => {
    if (!user?.ownedStore?.id) return;
    setPublishing(true);
    try {
      await api.post(`/stores/${user.ownedStore.id}/publish`, { publish: !isPublished });
      setIsPublished(!isPublished);
      toast.success(`Store ${!isPublished ? 'published! 🎉 It\'s now live.' : 'unpublished.'}`);
    } catch {
      toast.error('Failed to update store status');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Merchant Dashboard</h1>
        {user?.ownedStore && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className={`btn-secondary flex items-center space-x-2 ${isPublished ? 'text-green-600 border-green-300' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{publishing ? '...' : isPublished ? 'Published' : 'Publish Store'}</span>
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}/store/${user.ownedStore.slug}/home`;
                navigator.clipboard.writeText(url);
                toast.success('Store link copied to clipboard!');
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiCopy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <a
              href={`/store/${user.ownedStore.slug}/home`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center space-x-2"
            >
              <FiExternalLink className="w-4 h-4" />
              <span>View Store</span>
            </a>
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <StatCard key={i} loading={true} />
          ))
        ) : (
          statCards.map((stat, i) => (
            <StatCard key={stat.label} {...stat} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-secondary-900">Revenue Chart</h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input-field text-sm py-1 px-2 w-auto"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-secondary-500">
              {loading ? <LoadingSpinner /> : 'No revenue data'}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Recent Orders</h2>
            <Link to="/merchant/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                      <FiShoppingCart className="w-4 h-4 text-secondary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{order.orderNumber}</p>
                      <p className="text-xs text-secondary-500 truncate">
                        {order.customer?.firstName} {order.customer?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-medium text-secondary-900">{formatCurrency(Number(order.total))}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-center py-8">No orders yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Top Products</h2>
          {loading ? (
            <LoadingSpinner />
          ) : topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center text-xs font-medium text-secondary-600">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">
                        {item.product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-secondary-500">{item.totalSold} sold</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-900 flex-shrink-0">
                    {formatCurrency(Number(item.totalRevenue))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-center py-8">No products sold yet</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Sales Overview</h2>
            <FiClock className="w-5 h-5 text-secondary-400" />
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-secondary-500">
              {loading ? <LoadingSpinner /> : 'No sales data'}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900">Customers</h2>
          <FiUsers className="w-5 h-5 text-secondary-400" />
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : recentCustomers.length > 0 ? (
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Last Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {recentCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary-50 cursor-pointer" onClick={() => navigate(`/merchant/customers/${c.id}`)}>
                    <td className="px-4 py-3 text-sm font-medium text-secondary-900">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-500">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-secondary-700">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-secondary-900">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-sm text-secondary-500">
                      {c.lastOrder ? new Date(c.lastOrder.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {c.lastOrder ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[c.lastOrder.status] || 'bg-secondary-100 text-secondary-700'}`}>
                          {c.lastOrder.status}
                        </span>
                      ) : (
                        <span className="text-secondary-400 text-xs">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-secondary-500 text-center py-8">No customers yet</p>
        )}
      </div>
    </motion.div>
  );
}
