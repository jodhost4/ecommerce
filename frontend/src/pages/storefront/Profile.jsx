import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiMapPin, FiPlus, FiTrash2, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', avatar: '' });

  const [newAddr, setNewAddr] = useState({
    label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', postalCode: '', country: 'US', isDefault: false,
  });
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/auth/profile'),
      api.get('/stores/default/addresses'),
    ]).then(([profRes, addrRes]) => {
      const u = profRes.data.data;
      setProfile(u);
      setForm({ firstName: u.firstName || '', lastName: u.lastName || '', phone: u.phone || '', avatar: u.avatar || '' });
      setAddresses(addrRes.data.data);
    }).catch(() => {
      toast.error('Failed to load profile');
    }).finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      setProfile(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddr) {
        const res = await api.put(`/stores/default/addresses/${editingAddr.id}`, newAddr);
        setAddresses((prev) => prev.map((a) => a.id === editingAddr.id ? res.data.data : a));
        toast.success('Address updated');
      } else {
        const res = await api.post('/stores/default/addresses', newAddr);
        setAddresses((prev) => [...prev, res.data.data]);
        toast.success('Address added');
      }
      setShowAddrForm(false);
      setEditingAddr(null);
      setNewAddr({ label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'US', isDefault: false });
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/stores/default/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const startEditAddress = (addr) => {
    setNewAddr(addr);
    setEditingAddr(addr);
    setShowAddrForm(true);
  };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Account</h1>

      <div className="flex gap-1 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="max-w-lg space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <FiUser className="w-10 h-10 text-primary-600" />
                  )}
                </div>
                <button type="button" className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                  <FiCamera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{profile?.firstName} {profile?.lastName}</h2>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">First Name</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} className="input-field" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
              <input type="email" value={profile?.email || ''} className="input-field bg-gray-50" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="input-field" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center disabled:opacity-50">
              <FiSave className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'addresses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
              <button
                onClick={() => { setShowAddrForm(!showAddrForm); setEditingAddr(null); setNewAddr({ label: '', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'US', isDefault: false }); }}
                className="btn-secondary"
              >
                <FiPlus className="w-4 h-4 mr-1" /> Add Address
              </button>
            </div>

            {showAddrForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSaveAddress}
                className="mb-6 p-4 rounded-xl border border-gray-200 space-y-3"
              >
                <input type="text" placeholder="Label (Home, Office)" value={newAddr.label} onChange={(e) => setNewAddr((prev) => ({ ...prev, label: e.target.value }))} className="input-field" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name" value={newAddr.fullName} onChange={(e) => setNewAddr((prev) => ({ ...prev, fullName: e.target.value }))} className="input-field" required />
                  <input type="tel" placeholder="Phone" value={newAddr.phone} onChange={(e) => setNewAddr((prev) => ({ ...prev, phone: e.target.value }))} className="input-field" required />
                </div>
                <input type="text" placeholder="Address Line 1" value={newAddr.addressLine1} onChange={(e) => setNewAddr((prev) => ({ ...prev, addressLine1: e.target.value }))} className="input-field" required />
                <input type="text" placeholder="Address Line 2 (optional)" value={newAddr.addressLine2} onChange={(e) => setNewAddr((prev) => ({ ...prev, addressLine2: e.target.value }))} className="input-field" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr((prev) => ({ ...prev, city: e.target.value }))} className="input-field" required />
                  <input type="text" placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr((prev) => ({ ...prev, state: e.target.value }))} className="input-field" required />
                  <input type="text" placeholder="ZIP Code" value={newAddr.postalCode} onChange={(e) => setNewAddr((prev) => ({ ...prev, postalCode: e.target.value }))} className="input-field" required />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newAddr.isDefault} onChange={(e) => setNewAddr((prev) => ({ ...prev, isDefault: e.target.checked }))} className="rounded border-gray-300" />
                  Set as default address
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">{editingAddr ? 'Update' : 'Save'} Address</button>
                  <button type="button" onClick={() => { setShowAddrForm(false); setEditingAddr(null); }} className="btn-secondary">Cancel</button>
                </div>
              </motion.form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.length === 0 && !showAddrForm && (
                <p className="text-gray-500 col-span-full text-center py-8">No addresses saved yet</p>
              )}
              {addresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-xl border border-gray-200 relative">
                  {addr.isDefault && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <FiStar className="w-3 h-3" /> Default
                    </span>
                  )}
                  <p className="font-medium text-gray-900">{addr.label || 'Address'}</p>
                  <p className="text-sm text-gray-500 mt-1">{addr.fullName}</p>
                  <p className="text-sm text-gray-500">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-sm text-gray-500">{addr.addressLine2}</p>}
                  <p className="text-sm text-gray-500">{addr.city}, {addr.state} {addr.postalCode}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => startEditAddress(addr)} className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
