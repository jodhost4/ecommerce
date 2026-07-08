import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBarChart2, FiDollarSign, FiUsers, FiBox, FiPackage, FiFileText, FiDownload } from 'react-icons/fi';
import SalesReport from './SalesReport';
import RevenueReport from './RevenueReport';
import ProductReport from './ProductReport';
import api from '../../services/api';

const tabs = [
  { id: 'sales', label: 'Sales', icon: FiBarChart2 },
  { id: 'revenue', label: 'Revenue', icon: FiDollarSign },
  { id: 'customers', label: 'Customers', icon: FiUsers },
  { id: 'products', label: 'Products', icon: FiBox },
  { id: 'inventory', label: 'Inventory', icon: FiPackage },
  { id: 'orders', label: 'Orders', icon: FiFileText },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await api.get(`/reports/export/${activeTab}/${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  const tabVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Reports & Analytics</h1>
        <div className="flex items-center space-x-2">
          {['csv', 'excel', 'pdf'].map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={exporting}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 transition-colors"
            >
              <FiDownload className="w-4 h-4 mr-1.5" />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-secondary-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'sales' && <SalesReport compact />}
          {activeTab === 'revenue' && <RevenueReport compact />}
          {activeTab === 'products' && <ProductReport compact />}
          {activeTab === 'customers' && <CustomerReportTab />}
          {activeTab === 'inventory' && <InventoryReportTab />}
          {activeTab === 'orders' && <OrderReportTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CustomerReportTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/customers').then((res) => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: 'New Customers', value: data?.newCustomers || 0 },
    { label: 'Total Customers', value: data?.totalCustomers || 0 },
    { label: 'Repeat Rate', value: `${((data?.repeatRate || 0) * 100).toFixed(1)}%` },
    { label: 'Total Orders', value: data?.totalOrders || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-secondary-200 p-5">
            <p className="text-xs text-secondary-500">{stat.label}</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-secondary-200 p-5">
        <h3 className="text-sm font-semibold text-secondary-900 mb-4">Top Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Email</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {(data?.topCustomers || []).map((c, i) => (
                <tr key={c.id || i} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 text-sm text-secondary-700">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-secondary-500">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700 text-right">{c.orders}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700 text-right font-medium">${Number(c.totalSpent).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventoryReportTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/inventory').then((res) => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <p className="text-xs text-secondary-500">Total Products</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{data?.totalProducts || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <p className="text-xs text-secondary-500">Total Stock</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{data?.totalStock || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <p className="text-xs text-secondary-500">Inventory Value</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">${Number(data?.totalValue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <p className="text-xs text-secondary-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{data?.lowStockCount || 0}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-secondary-200 p-5">
        <h3 className="text-sm font-semibold text-secondary-900 mb-4">Low Stock Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {(data?.lowStockItems || []).map((item, i) => (
                <tr key={item.id || i} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 text-sm text-secondary-700">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-secondary-500">{item.sku}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-700 text-right">${Number(item.value).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrderReportTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/orders').then((res) => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    RETURNED: 'bg-orange-100 text-orange-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <p className="text-xs text-secondary-500">Total Orders</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{data?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <p className="text-xs text-secondary-500">Avg Fulfillment Time</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">
            {data?.averageFulfillmentTime ? `${(data.averageFulfillmentTime / 24).toFixed(1)} days` : 'N/A'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <h3 className="text-sm font-semibold text-secondary-900 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {(data?.statusBreakdown || []).map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || 'bg-secondary-100 text-secondary-700'}`}>
                  {s.status}
                </span>
                <span className="text-sm font-medium text-secondary-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <h3 className="text-sm font-semibold text-secondary-900 mb-4">Recent Orders (7 Days)</h3>
          <div className="space-y-3">
            {(data?.ordersByDate || []).map((d) => (
              <div key={d.date} className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">{new Date(d.date).toLocaleDateString()}</span>
                <span className="text-sm font-medium text-secondary-900">{d.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
