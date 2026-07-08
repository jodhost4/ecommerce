import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiSettings, FiGlobe, FiPercent, FiTruck } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CURRENCIES, LANGUAGES } from '../../utils/constants';
import authStore from '../../store/authStore';

const tabs = [
  { id: 'general', label: 'General', icon: FiSettings },
  { id: 'currency', label: 'Currency & Language', icon: FiGlobe },
  { id: 'tax', label: 'Tax Settings', icon: FiPercent },
  { id: 'shipping', label: 'Shipping', icon: FiTruck },
];

export default function StoreSettings() {
  const storeId = authStore.user?.ownedStore?.id;

  const [activeTab, setActiveTab] = useState('general');
  const [store, setStore] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', email: '', phone: '',
    address: '', city: '', state: '', country: '', zipCode: '',
    currency: 'USD', language: 'en', timezone: 'UTC',
    taxRate: 0, taxIncluded: false,
    shippingOrigin: '',
  });

  useEffect(() => {
    fetchData();
  }, [storeId]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: storeRes } = await api.get(`/stores/${storeId}`);
      const storeData = storeRes.data;
      setStore(storeData);

      const slug = storeData.slug;
      const { data: settingsRes } = await api.get(`/stores/${storeId}/settings`);
      const settingsData = settingsRes.data;
      setSettings(settingsData);

      setForm({
        name: storeData.name || '',
        description: storeData.description || '',
        email: storeData.email || '',
        phone: storeData.phone || '',
        address: storeData.address || '',
        city: storeData.city || '',
        state: storeData.state || '',
        country: storeData.country || '',
        zipCode: storeData.zipCode || '',
        currency: settingsData.currency || 'USD',
        language: settingsData.language || 'en',
        timezone: settingsData.timezone || 'UTC',
        taxRate: settingsData.taxRate || 0,
        taxIncluded: settingsData.taxIncluded || false,
        shippingOrigin: settingsData.shippingOrigin || '',
      });
    } catch (err) {
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const storeUpdates = {};
      if (form.name !== store?.name) storeUpdates.name = form.name;
      if (form.description !== store?.description) storeUpdates.description = form.description;
      if (form.email !== store?.email) storeUpdates.email = form.email;
      if (form.phone !== store?.phone) storeUpdates.phone = form.phone;
      if (form.address !== store?.address) storeUpdates.address = form.address;
      if (form.city !== store?.city) storeUpdates.city = form.city;
      if (form.state !== store?.state) storeUpdates.state = form.state;
      if (form.country !== store?.country) storeUpdates.country = form.country;
      if (form.zipCode !== store?.zipCode) storeUpdates.zipCode = form.zipCode;

      if (Object.keys(storeUpdates).length > 0) {
        await api.put(`/stores/${storeId}`, storeUpdates);
      }

      await api.put(`/stores/${storeId}/settings`, {
        currency: form.currency,
        language: form.language,
        timezone: form.timezone,
        taxRate: form.taxRate,
        taxIncluded: form.taxIncluded,
        shippingOrigin: form.shippingOrigin,
      });

      toast.success('Settings saved successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Store Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg">
          <FiSave className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>

      <div className="flex gap-1 bg-secondary-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {activeTab === 'general' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Store Name</label>
                <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className="input w-full h-24 resize-none" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-2">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input type="text" value={form.address} onChange={(e) => updateField('address', e.target.value)} className="input w-full" placeholder="Address" />
                </div>
                <input type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} className="input" placeholder="City" />
                <input type="text" value={form.state} onChange={(e) => updateField('state', e.target.value)} className="input" placeholder="State" />
                <input type="text" value={form.country} onChange={(e) => updateField('country', e.target.value)} className="input" placeholder="Country" />
                <input type="text" value={form.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} className="input" placeholder="ZIP Code" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'currency' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Currency & Language</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Currency</label>
                <select value={form.currency} onChange={(e) => updateField('currency', e.target.value)} className="input w-full">
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Language</label>
                <select value={form.language} onChange={(e) => updateField('language', e.target.value)} className="input w-full">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Timezone</label>
                <select value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)} className="input w-full">
                  {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'].map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Tax Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => updateField('taxRate', Number(e.target.value))} className="input w-full" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.taxIncluded} onChange={(e) => updateField('taxIncluded', e.target.checked)} className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-700">Tax included in prices</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Shipping Settings</h2>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Origin Address</label>
              <textarea
                value={form.shippingOrigin}
                onChange={(e) => updateField('shippingOrigin', e.target.value)}
                className="input w-full h-24 resize-none"
                placeholder="123 Main St, City, State, ZIP, Country"
              />
              <p className="text-xs text-secondary-400 mt-1">This address will be used as the default origin for shipping rate calculations.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
