import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiInfo, FiShoppingBag, FiTag, FiAlertCircle, FiCheck, FiCheckCircle, FiSettings, FiMail, FiMessageSquare, FiSmartphone, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TYPE_ICONS = {
  ORDER: { icon: FiShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
  PROMOTION: { icon: FiTag, color: 'text-green-600', bg: 'bg-green-100' },
  SYSTEM: { icon: FiInfo, color: 'text-purple-600', bg: 'bg-purple-100' },
  ALERT: { icon: FiAlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
};

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'ORDER', label: 'Orders' },
  { value: 'PROMOTION', label: 'Promotions' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'ALERT', label: 'Alerts' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, unreadCount: 0 });
  const [typeFilter, setTypeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');
  const [preferences, setPreferences] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, typeFilter]);

  useEffect(() => {
    if (activeTab === 'preferences') fetchPreferences();
  }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: pagination.page, limit: 20 });
    if (typeFilter) params.set('type', typeFilter);

    try {
      const res = await api.get(`/notifications?${params}`);
      setNotifications(res.data.data);
      setPagination((prev) => ({ ...prev, ...res.data.pagination, unreadCount: res.data.pagination?.total || 0 }));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    setPrefsLoading(true);
    try {
      const res = await api.get('/notifications/preferences');
      setPreferences(res.data.data);
    } catch {
      setPreferences({
        orderUpdates: true, promotions: true, productAlerts: true, newsletter: false,
        emailNotifications: true, pushNotifications: true, smsNotifications: false,
      });
    } finally {
      setPrefsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setPagination((prev) => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setPagination((prev) => ({ ...prev, unreadCount: 0 }));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleSendTest = async () => {
    try {
      await api.post('/notifications/test');
      toast.success('Test notification sent');
      fetchNotifications();
    } catch {
      toast.error('Failed to send test notification');
    }
  };

  const handleUpdatePreferences = async (key, value) => {
    try {
      const res = await api.put('/notifications/preferences', { [key]: value });
      setPreferences(res.data.data);
      toast.success('Preferences updated');
    } catch {
      toast.error('Failed to update preferences');
    }
  };

  const unreadCount = pagination.unreadCount;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSendTest} className="btn-secondary text-sm">Send Test</button>
          <button onClick={handleMarkAllAsRead} className="btn-secondary text-sm" disabled={unreadCount === 0}>
            <FiCheckCircle className="w-4 h-4 mr-1" /> Mark All Read
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'notifications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiBell className="w-4 h-4" /> Notifications
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'preferences' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiSettings className="w-4 h-4" /> Preferences
        </button>
      </div>

      {activeTab === 'notifications' && (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => { setTypeFilter(filter.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                className={`whitespace-nowrap px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  typeFilter === filter.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, i) => {
                const typeConfig = TYPE_ICONS[notification.type] || TYPE_ICONS.SYSTEM;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`p-4 rounded-xl border transition-colors ${
                      notification.isRead ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeConfig.bg} flex-shrink-0`}>
                        <typeConfig.icon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
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
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'preferences' && (
        <div className="max-w-lg">
          {prefsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Notification Types</h3>
                <div className="space-y-3">
                  {[
                    { key: 'orderUpdates', label: 'Order Updates', desc: 'Order confirmations, shipping updates, and delivery notifications' },
                    { key: 'promotions', label: 'Promotions', desc: 'Sales, discounts, and special offers' },
                    { key: 'productAlerts', label: 'Product Alerts', desc: 'Back in stock, price drops, and new arrivals' },
                    { key: 'newsletter', label: 'Newsletter', desc: 'Weekly newsletter and blog updates' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdatePreferences(item.key, !preferences?.[item.key])}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${preferences?.[item.key] ? 'bg-primary-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${preferences?.[item.key] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Channels</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailNotifications', label: 'Email', icon: FiMail, desc: 'Receive notifications via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', icon: FiMessageSquare, desc: 'Receive notifications in browser' },
                    { key: 'smsNotifications', label: 'SMS', icon: FiSmartphone, desc: 'Receive notifications via text message' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdatePreferences(item.key, !preferences?.[item.key])}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${preferences?.[item.key] ? 'bg-primary-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${preferences?.[item.key] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
