import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';

const presets = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function SalesReport({ storeId, compact = false }) {
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 30 * 86400000), end: new Date() });
  const [preset, setPreset] = useState('30D');
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        groupBy,
      };
      if (storeId) params.storeId = storeId;
      const res = await api.get('/reports/sales', { params });
      setData(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, groupBy]);

  const handlePreset = (days, label) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    setDateRange({ start, end });
    setPreset(label);
  };

  const summaryCards = [
    { label: 'Total Sales', value: formatCurrency(data?.summary?.totalSales || 0), icon: FiDollarSign, color: 'bg-green-500' },
    { label: 'Total Orders', value: formatNumber(data?.summary?.totalOrders || 0), icon: FiShoppingCart, color: 'bg-blue-500' },
    { label: 'Avg Order Value', value: formatCurrency(data?.summary?.averageOrderValue || 0), icon: FiTrendingUp, color: 'bg-purple-500' },
  ];

  const columns = [
    { header: 'Date', accessor: 'date' },
    { header: 'Sales', accessor: 'sales', cell: (row) => formatCurrency(row.sales) },
    { header: 'Orders', accessor: 'orders' },
    { header: 'Items', accessor: 'items' },
  ];

  const content = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.days, p.label)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              preset === p.label ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            {p.label}
          </button>
        ))}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="ml-auto px-3 py-1.5 text-sm border border-secondary-300 rounded-lg"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-secondary-200 p-5"
              >
                <div className="flex items-center space-x-3">
                  <div className={`${card.color} p-2.5 rounded-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500">{card.label}</p>
                    <p className="text-lg font-bold text-secondary-900">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-secondary-200 p-5">
              <h3 className="text-sm font-semibold text-secondary-900 mb-4">Sales Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-secondary-200 p-5">
              <h3 className="text-sm font-semibold text-secondary-900 mb-4">Sales by Day</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-4">Daily Breakdown</h3>
            <DataTable
              columns={columns}
              data={data?.data || []}
              pagination
              pageSize={10}
            />
          </div>
        </>
      )}
    </div>
  );

  if (compact) return content;
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Sales Report</h1>
      {content}
    </div>
  );
}
