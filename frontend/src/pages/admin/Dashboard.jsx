import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiUsers, FiDollarSign, FiBarChart2, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statCards = [
  { key: 'stores', label: 'Total Stores', icon: FiShoppingBag, color: 'bg-blue-500' },
  { key: 'users', label: 'Total Users', icon: FiUsers, color: 'bg-green-500' },
  { key: 'revenue', label: 'Revenue', icon: FiDollarSign, color: 'bg-purple-500' },
  { key: 'orders', label: 'Orders', icon: FiBarChart2, color: 'bg-orange-500' },
];

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

const roleColors = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  STORE_OWNER: 'bg-blue-100 text-blue-800',
  STORE_STAFF: 'bg-purple-100 text-purple-800',
  CUSTOMER: 'bg-green-100 text-green-800',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  const chartData = stats?.revenue?.overTime || [
    { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 }, { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 }, { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
  ];

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-secondary-900 mb-6">
        Super Admin Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => {
          const data = stats?.[card.key] || { total: 0, growth: 0 };
          const isCurrency = card.key === 'revenue';
          const displayValue = isCurrency ? `$${Number(data.total).toLocaleString()}` : Number(data.total).toLocaleString();
          const isPositive = data.growth >= 0;

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <FiTrendingUp className="w-4 h-4 mr-1" /> : <FiTrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(data.growth)}%
                </span>
              </div>
              <p className="text-sm text-secondary-500">{card.label}</p>
              <p className="text-2xl font-bold text-secondary-900">{displayValue}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Revenue Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-secondary-500 border-b border-secondary-200">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentOrders || []).length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-secondary-400">No recent orders</td></tr>
                ) : (
                  stats?.recentOrders?.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-secondary-100"
                    >
                      <td className="py-3 font-medium text-secondary-900">#{order.orderNumber}</td>
                      <td className="py-3 text-secondary-600">{order.customer}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-secondary-900 font-medium">${Number(order.total).toLocaleString()}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Recent Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats?.recentUsers || []).length === 0 ? (
            <p className="text-secondary-400 col-span-full text-center py-4">No recent users</p>
          ) : (
            stats?.recentUsers?.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center p-3 rounded-lg border border-secondary-200 hover:border-primary-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm mr-3">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-secondary-500 truncate">{user.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role?.name] || 'bg-gray-100 text-gray-800'}`}>
                  {user.role?.name}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
