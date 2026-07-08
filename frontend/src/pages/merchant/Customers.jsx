import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiChevronLeft, FiChevronRight, FiMail, FiPhone, FiShoppingBag, FiDollarSign, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) { setPage(1); fetchCustomers(); }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (customer) => {
    if (expandedId === customer.id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(customer.id);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/customers/${customer.id}`);
      setExpandedData(res.data.data);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Customers</h1>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-200">
                <th className="w-8 px-2"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Contact</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Orders</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Total Spent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12"><LoadingSpinner /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-secondary-500">No customers found</td></tr>
              ) : (
                customers.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-secondary-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(customer)}
                  >
                    <td className="px-2 py-3 text-center">
                      {expandedId === customer.id ? <FiChevronUp className="w-4 h-4 text-secondary-400 inline" /> : <FiChevronDown className="w-4 h-4 text-secondary-400 inline" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                          {customer.firstName?.[0]}{customer.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{customer.firstName} {customer.lastName}</p>
                          <p className="text-xs text-secondary-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 text-sm text-secondary-600">
                        {customer.email && <span className="flex items-center space-x-1"><FiMail className="w-3.5 h-3.5" /><span>{customer.email}</span></span>}
                        {customer.phone && <span className="flex items-center space-x-1"><FiPhone className="w-3.5 h-3.5" /><span>{customer.phone}</span></span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-secondary-900">{customer.totalOrders}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-secondary-900">{formatCurrency(Number(customer.totalSpent))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-secondary-600">{formatDate(customer.createdAt)}</span>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="btn-secondary p-2 disabled:opacity-50">
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-secondary-400">...</span>}
                    <button onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md ${p === pagination.page ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-200'}`}>{p}</button>
                  </span>
                ))}
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="btn-secondary p-2 disabled:opacity-50">
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expandedId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card mt-4 overflow-hidden"
          >
            {loadingDetail ? <LoadingSpinner /> : expandedData && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg">
                      {expandedData.firstName?.[0]}{expandedData.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-secondary-900">{expandedData.firstName} {expandedData.lastName}</h2>
                      <p className="text-sm text-secondary-500">{expandedData.email}</p>
                    </div>
                  </div>
                  <Link to={`/merchant/customers/${expandedData.id}`} className="btn-primary px-4 py-2 text-sm">View Full Profile</Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-secondary-900 mb-3">Recent Orders</h3>
                    <div className="space-y-2">
                      {expandedData.orders?.length > 0 ? expandedData.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                          <div>
                            <Link to={`/merchant/orders/${order.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">{order.orderNumber}</Link>
                            <p className="text-xs text-secondary-500">{order.orderItems?.length || 0} items</p>
                          </div>
                          <p className="text-sm font-medium text-secondary-900">{formatCurrency(Number(order.total))}</p>
                        </div>
                      )) : <p className="text-sm text-secondary-500">No orders yet</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-secondary-900 mb-3">Addresses</h3>
                    <div className="space-y-2">
                      {expandedData.addresses?.length > 0 ? expandedData.addresses.map((addr) => (
                        <div key={addr.id} className="p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-secondary-700">{addr.label}</span>
                            {addr.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Default</span>}
                          </div>
                          <p className="text-sm text-secondary-600">{addr.address1}, {addr.city}, {addr.state} {addr.zipCode}</p>
                        </div>
                      )) : <p className="text-sm text-secondary-500">No addresses saved</p>}
                    </div>
                  </div>
                </div>

                {expandedData.notes && (
                  <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-500 mb-1">Notes</p>
                    <p className="text-sm text-secondary-700">{expandedData.notes}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
