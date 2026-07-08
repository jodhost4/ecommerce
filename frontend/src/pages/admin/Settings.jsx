import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSave, FiMail, FiShield, FiDollarSign, FiSettings, FiCreditCard, FiPercent } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const tabs = [
  { key: 'general', label: 'General', icon: FiSettings },
  { key: 'payment', label: 'Payment', icon: FiCreditCard },
  { key: 'smtp', label: 'SMTP', icon: FiMail },
  { key: 'tax', label: 'Tax', icon: FiPercent },
  { key: 'currency', label: 'Currency', icon: FiDollarSign },
  { key: 'security', label: 'Security', icon: FiShield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: '',
    supportEmail: '',
    maintenanceMode: false,
    registrationEnabled: true,
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
    smtpFromEmail: '',
    jwtExpiry: '7d',
    rateLimiting: 100,
    maxLoginAttempts: 5,
    defaultTaxRate: 0,
    taxIncluded: false,
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD'],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings');
      if (data.data) setSettings((prev) => ({ ...prev, ...data.data }));
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function update(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Platform Settings</h1>
        <button onClick={fetchSettings} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="card p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}>
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <form onSubmit={handleSave}>
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-secondary-900 mb-4">General Settings</h2>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Platform Name</label>
                    <input type="text" value={settings.platformName} onChange={(e) => update('platformName', e.target.value)} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Support Email</label>
                    <input type="email" value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} className="input w-full" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary-700">Maintenance Mode</p>
                      <p className="text-xs text-secondary-500">Disable access for non-admin users</p>
                    </div>
                    <button type="button" onClick={() => update('maintenanceMode', !settings.maintenanceMode)} className={`w-10 h-5 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-orange-500' : 'bg-secondary-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary-700">User Registration</p>
                      <p className="text-xs text-secondary-500">Allow new users to register</p>
                    </div>
                    <button type="button" onClick={() => update('registrationEnabled', !settings.registrationEnabled)} className={`w-10 h-5 rounded-full transition-colors relative ${settings.registrationEnabled ? 'bg-green-500' : 'bg-secondary-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${settings.registrationEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-secondary-900 mb-4">Payment Settings</h2>
                  <p className="text-sm text-secondary-500">Payment gateway configuration coming soon.</p>
                </div>
              )}

              {activeTab === 'smtp' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-secondary-900 mb-4">SMTP Configuration</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">SMTP Host</label>
                      <input type="text" value={settings.smtpHost} onChange={(e) => update('smtpHost', e.target.value)} className="input w-full" placeholder="smtp.gmail.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">SMTP Port</label>
                      <input type="text" value={settings.smtpPort} onChange={(e) => update('smtpPort', e.target.value)} className="input w-full" placeholder="587" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Username</label>
                      <input type="text" value={settings.smtpUsername} onChange={(e) => update('smtpUsername', e.target.value)} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Password</label>
                      <input type="password" value={settings.smtpPassword} onChange={(e) => update('smtpPassword', e.target.value)} className="input w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">From Email</label>
                    <input type="email" value={settings.smtpFromEmail} onChange={(e) => update('smtpFromEmail', e.target.value)} className="input w-full" placeholder="noreply@example.com" />
                  </div>
                </div>
              )}

              {activeTab === 'tax' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-secondary-900 mb-4">Tax Settings</h2>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Default Tax Rate (%)</label>
                    <input type="number" step="0.01" min="0" max="100" value={settings.defaultTaxRate} onChange={(e) => update('defaultTaxRate', parseFloat(e.target.value) || 0)} className="input w-full sm:w-48" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary-700">Tax Included in Prices</p>
                      <p className="text-xs text-secondary-500">Show prices with tax included</p>
                    </div>
                    <button type="button" onClick={() => update('taxIncluded', !settings.taxIncluded)} className={`w-10 h-5 rounded-full transition-colors relative ${settings.taxIncluded ? 'bg-green-500' : 'bg-secondary-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${settings.taxIncluded ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'currency' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-secondary-900 mb-4">Currency Settings</h2>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Default Currency</label>
                    <select value={settings.defaultCurrency} onChange={(e) => update('defaultCurrency', e.target.value)} className="input w-full sm:w-48">
                      {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'NGN', 'ZAR', 'KES', 'GHS'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Supported Currencies</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'NGN', 'ZAR', 'KES', 'GHS'].map((c) => {
                        const selected = settings.supportedCurrencies?.includes(c);
                        return (
                          <button key={c} type="button" onClick={() => {
                            const current = settings.supportedCurrencies || [];
                            update('supportedCurrencies', selected ? current.filter((x) => x !== c) : [...current, c]);
                          }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selected ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-secondary-200 text-secondary-600 hover:border-secondary-300'}`}>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-secondary-900 mb-4">Security Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">JWT Expiry</label>
                      <select value={settings.jwtExpiry} onChange={(e) => update('jwtExpiry', e.target.value)} className="input w-full">
                        <option value="1h">1 Hour</option>
                        <option value="6h">6 Hours</option>
                        <option value="12h">12 Hours</option>
                        <option value="1d">1 Day</option>
                        <option value="7d">7 Days</option>
                        <option value="30d">30 Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Rate Limit (req/min)</label>
                      <input type="number" min="0" value={settings.rateLimiting} onChange={(e) => update('rateLimiting', parseInt(e.target.value) || 0)} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Max Login Attempts</label>
                      <input type="number" min="0" value={settings.maxLoginAttempts} onChange={(e) => update('maxLoginAttempts', parseInt(e.target.value) || 0)} className="input w-full" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-secondary-200">
                <button type="submit" disabled={saving} className="btn-primary px-6 py-2 rounded-lg flex items-center">
                  <FiSave className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
