import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiPercent, FiTruck, FiTag } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const presets = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function RevenueReport({ storeId, compact = false }) {
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 30 * 86400000), end: new Date() });
  const [preset, setPreset] = useState('30D');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      };
      if (storeId) params.storeId = storeId;
      const res = await api.get('/reports/revenue', { params });
      setData(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handlePreset = (days, label) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 86400000);
    setDateRange({ start, end });
    setPreset(label);
  };

  const breakdownData = data?.breakdown
    ? [
        { name: 'Subtotal', value: data.breakdown.subtotal },
        { name: 'Tax', value: data.breakdown.tax },
        { name: 'Shipping', value: data.breakdown.shipping },
        { name: 'Discounts', value: data.breakdown.discounts },
      ]
    : [];

  const total = data?.breakdown?.total || 0;

  const summaryCards = [
    { label: 'Total Revenue', value: formatCurrency(total), icon: FiDollarSign, color: 'bg-green-500' },
    { label: 'Avg Tax Rate', value: formatPercentage(total > 0 ? (data?.breakdown?.tax || 0) / total : 0), icon: FiPercent, color: 'bg-blue-500' },
    { label: 'Shipping Collected', value: formatCurrency(data?.breakdown?.shipping || 0), icon: FiTruck, color: 'bg-orange-500' },
    { label: 'Discounts Given', value: formatCurrency(data?.breakdown?.discounts || 0), icon: FiTag, color: 'bg-red-500' },
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
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <h3 className="text-sm font-semibold text-secondary-900 mb-4">Revenue Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Amount">
                    {breakdownData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-secondary-200 p-5">
              <h3 className="text-sm font-semibold text-secondary-900 mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.categoryRevenue || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {(data?.categoryRevenue || []).map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (compact) return content;
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Revenue Report</h1>
      {content}
    </div>
  );
}
