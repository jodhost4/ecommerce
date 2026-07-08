import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiUsers, FiShoppingBag, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const periodOptions = ['7d', '30d', '90d', '1y'];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [topStores, setTopStores] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/analytics', { params: { period } });
      setStats(data.data.metrics);
      setGrowthData(data.data.growth || []);
      setTopStores(data.data.topStores || []);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">System Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary-100 rounded-lg p-1">
            {periodOptions.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === p ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}>{p}</button>
            ))}
          </div>
          <button onClick={fetchAnalytics} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-secondary-500">Total Revenue</p>
            <div className="p-2 bg-purple-100 rounded-lg"><FiDollarSign className="w-4 h-4 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-secondary-900">${Number(stats?.totalRevenue || 0).toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">+{stats?.revenueGrowth || 0}% vs last period</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-secondary-500">Active Stores</p>
            <div className="p-2 bg-blue-100 rounded-lg"><FiShoppingBag className="w-4 h-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{stats?.activeStores || 0}</p>
          <p className="text-xs text-green-600 mt-1">+{stats?.storeGrowth || 0} vs last period</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-secondary-500">Total Users</p>
            <div className="p-2 bg-green-100 rounded-lg"><FiUsers className="w-4 h-4 text-green-600" /></div>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-green-600 mt-1">+{stats?.userGrowth || 0} vs last period</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-secondary-500">Total Orders</p>
            <div className="p-2 bg-orange-100 rounded-lg"><FiTrendingUp className="w-4 h-4 text-orange-600" /></div>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{stats?.totalOrders || 0}</p>
          <p className="text-xs text-green-600 mt-1">+{stats?.orderGrowth || 0}% vs last period</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-secondary-500">Revenue Over Time</h3>
            <div className="p-2 bg-purple-100 rounded-lg"><FiDollarSign className="w-4 h-4 text-purple-600" /></div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData.length ? growthData : [{ month: 'N/A', revenue: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-secondary-500">User Growth</h3>
            <div className="p-2 bg-green-100 rounded-lg"><FiUsers className="w-4 h-4 text-green-600" /></div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData.length ? growthData : [{ month: 'N/A', users: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-secondary-500">Store Registrations</h3>
            <div className="p-2 bg-blue-100 rounded-lg"><FiShoppingBag className="w-4 h-4 text-blue-600" /></div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData.length ? growthData : [{ month: 'N/A', stores: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Bar dataKey="stores" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Top Stores by Revenue</h2>
          {topStores.length === 0 ? (
            <p className="text-center text-secondary-400 py-8">No store data available</p>
          ) : (
            <div className="space-y-3">
              {topStores.map((store, i) => (
                <motion.div key={store.id || store.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors">
                  <div className="flex items-center">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center mr-3">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{store.name}</p>
                      <p className="text-xs text-secondary-500">{store.orders || 0} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-secondary-900">${Number(store.revenue || 0).toLocaleString()}</p>
                    <span className={`text-xs font-medium ${(store.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(store.growth || 0) >= 0 ? '+' : ''}{store.growth || 0}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <p className="text-3xl font-bold text-blue-700">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-blue-600 mt-1">Total Users</p>
              <p className="text-xs text-blue-500 mt-1">+{stats?.userGrowth || 0} this period</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <p className="text-3xl font-bold text-green-700">{stats?.activeStores || 0}</p>
              <p className="text-sm text-green-600 mt-1">Active Stores</p>
              <p className="text-xs text-green-500 mt-1">+{stats?.storeGrowth || 0} this period</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <p className="text-3xl font-bold text-purple-700">${Number(stats?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-purple-600 mt-1">Total Revenue</p>
              <p className="text-xs text-purple-500 mt-1">{stats?.revenueGrowth || 0}% growth</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <p className="text-3xl font-bold text-orange-700">{stats?.totalOrders || 0}</p>
              <p className="text-sm text-orange-600 mt-1">Total Orders</p>
              <p className="text-xs text-orange-500 mt-1">{stats?.orderGrowth || 0}% growth</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-secondary-50 rounded-xl">
            <h3 className="text-sm font-medium text-secondary-700 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-secondary-500">Avg Order Value</span><span className="font-medium text-secondary-900">${Number(stats?.avgOrderValue || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-secondary-500">Conversion Rate</span><span className="font-medium text-secondary-900">{stats?.conversionRate || 0}%</span></div>
              <div className="flex justify-between"><span className="text-secondary-500">Pending Verifications</span><span className="font-medium text-secondary-900">{stats?.pendingVerifications || 0}</span></div>
              <div className="flex justify-between"><span className="text-secondary-500">Open Support Tickets</span><span className="font-medium text-secondary-900">{stats?.openTickets || 0}</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
