import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

export default function ProductReport({ storeId, compact = false }) {
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
      const res = await api.get('/reports/products', { params });
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

  const summaryCards = [
    { label: 'Products Sold', value: formatNumber(data?.totalProductsSold || 0), icon: FiPackage, color: 'bg-blue-500' },
    { label: 'Total Revenue', value: formatCurrency(data?.totalRevenue || 0), icon: FiTrendingUp, color: 'bg-green-500' },
    { label: 'Top Product Units', value: formatNumber(data?.topSellers?.[0]?.unitsSold || 0), icon: FiTrendingUp, color: 'bg-purple-500' },
  ];

  const columns = [
    { header: 'Product', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Category', accessor: 'category' },
    { header: 'Units Sold', accessor: 'unitsSold' },
    { header: 'Revenue', accessor: 'revenue', cell: (row) => formatCurrency(row.revenue) },
    {
      header: '',
      accessor: 'actions',
      cell: () => (
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">View</button>
      ),
    },
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

          <div className="bg-white rounded-xl border border-secondary-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-4">Top 10 Products</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data?.topSellers || []} layout="vertical" margin={{ left: 150 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={140} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="unitsSold" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-4">Product Performance</h3>
            <DataTable
              columns={columns}
              data={data?.topSellers || []}
              pagination
              pageSize={10}
              searchable
              searchPlaceholder="Search products..."
            />
          </div>
        </>
      )}
    </div>
  );

  if (compact) return content;
  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Product Report</h1>
      {content}
    </div>
  );
}
