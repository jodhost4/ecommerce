import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMail, FiPhone, FiMapPin, FiCalendar, FiShoppingBag, FiHeart, FiStar, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const tabs = [
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'reviews', label: 'Reviews', icon: FiStar },
  ];

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data.data);
      setNotes(res.data.data.notes || '');
    } catch {
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await api.put(`/customers/${id}`, { notes });
      toast.success('Notes updated');
      setEditingNotes(false);
    } catch {
      toast.error('Failed to update notes');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!customer) return <p className="text-center text-secondary-500 py-12">Customer not found</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center space-x-3 mb-6">
        <Link to="/merchant/customers" className="text-sm text-primary-600 hover:text-primary-700">&larr; Back to Customers</Link>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
              {customer.firstName?.[0]}{customer.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{customer.firstName} {customer.lastName}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center space-x-1 text-sm text-secondary-600"><FiMail className="w-4 h-4" /><span>{customer.email}</span></span>
                {customer.phone && <span className="flex items-center space-x-1 text-sm text-secondary-600"><FiPhone className="w-4 h-4" /><span>{customer.phone}</span></span>}
                <span className="flex items-center space-x-1 text-sm text-secondary-600"><FiCalendar className="w-4 h-4" /><span>Joined {formatDate(customer.createdAt)}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-secondary-500">Total Orders</p>
              <p className="text-xl font-bold text-secondary-900">{customer.totalOrders}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary-500">Total Spent</p>
              <p className="text-xl font-bold text-secondary-900">{formatCurrency(Number(customer.totalSpent))}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'orders' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Order History</h2>
              {customer.orders?.length > 0 ? (
                <div className="space-y-3">
                  {customer.orders.map((order) => (
                    <Link key={order.id} to={`/merchant/orders/${order.id}`} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-primary-600">{order.orderNumber}</p>
                        <p className="text-xs text-secondary-500">{formatDateTime(order.createdAt)} &middot; {order.orderItems?.length || 0} items</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-secondary-900">{formatCurrency(Number(order.total))}</p>
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-200' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>{order.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-sm text-secondary-500">No orders yet</p>}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Saved Addresses</h2>
              {customer.addresses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.addresses.map((addr) => (
                    <div key={addr.id} className="p-4 border border-secondary-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-secondary-900">{addr.label}</span>
                        {addr.isDefault && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-sm text-secondary-600">{addr.address1}</p>
                      {addr.address2 && <p className="text-sm text-secondary-600">{addr.address2}</p>}
                      <p className="text-sm text-secondary-600">{addr.city}, {addr.state} {addr.zipCode}</p>
                      <p className="text-sm text-secondary-600">{addr.country}</p>
                      {addr.phone && <p className="text-sm text-secondary-600 mt-1">{addr.phone}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-secondary-500">No addresses saved</p>}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Wishlist</h2>
              {customer.wishlist?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customer.wishlist.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                      <div className="w-12 h-12 bg-secondary-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product?.images?.[0]?.url ? (
                          <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary-400">N/A</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{item.product?.name}</p>
                        <p className="text-xs text-secondary-500">{formatCurrency(Number(item.product?.basePrice))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-secondary-500">No items in wishlist</p>}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Reviews</h2>
              {customer.reviews?.length > 0 ? (
                <div className="space-y-3">
                  {customer.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-secondary-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-secondary-900">{review.product?.name}</p>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <FiStar key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-secondary-300'}`} />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="text-sm font-medium text-secondary-700">{review.title}</p>}
                      {review.content && <p className="text-sm text-secondary-600 mt-1">{review.content}</p>}
                      <p className="text-xs text-secondary-400 mt-2">{formatDateTime(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-secondary-500">No reviews yet</p>}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-3">Customer Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-xs text-secondary-500">Email</dt>
                <dd className="text-sm text-secondary-900">{customer.email}</dd>
              </div>
              {customer.phone && <div className="flex justify-between">
                <dt className="text-xs text-secondary-500">Phone</dt>
                <dd className="text-sm text-secondary-900">{customer.phone}</dd>
              </div>}
              <div className="flex justify-between">
                <dt className="text-xs text-secondary-500">Orders</dt>
                <dd className="text-sm text-secondary-900">{customer.totalOrders}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-secondary-500">Total Spent</dt>
                <dd className="text-sm text-secondary-900">{formatCurrency(Number(customer.totalSpent))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-secondary-500">Joined</dt>
                <dd className="text-sm text-secondary-900">{formatDate(customer.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-secondary-900">Notes</h3>
              <button onClick={() => setEditingNotes(!editingNotes)} className="text-primary-600 hover:text-primary-700">
                {editingNotes ? <FiX className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
              </button>
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field min-h-[100px]" placeholder="Add notes about this customer..." />
                <button onClick={handleSaveNotes} className="btn-primary w-full flex items-center justify-center space-x-2">
                  <FiSave className="w-4 h-4" /><span>Save Notes</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-secondary-600">{customer.notes || 'No notes added'}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
