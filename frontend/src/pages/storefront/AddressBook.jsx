import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiStar, FiX, FiHome, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const emptyForm = {
  label: '',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  isDefault: false,
};

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    api.get('/stores/default/addresses').then((res) => {
      setAddresses(res.data.data || []);
    }).catch(() => {
      setAddresses([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddForm = () => {
    setForm({ ...emptyForm });
    setEditing(null);
    setShowForm(true);
  };

  const openEditForm = (addr) => {
    setForm({ ...addr });
    setEditing(addr);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await api.put(`/stores/default/addresses/${editing.id}`, form);
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? res.data.data : a));
        toast.success('Address updated');
      } else {
        const res = await api.post('/stores/default/addresses', form);
        setAddresses((prev) => [...prev, res.data.data]);
        toast.success('Address added');
      }
      closeForm();
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/stores/default/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await api.put(`/stores/default/addresses/${id}`, { isDefault: true });
      setAddresses((prev) => prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })));
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to set default address');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
          <p className="text-sm text-gray-500 mt-1">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <FiPlus className="w-4 h-4 mr-1" /> Add Address
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSave}
            className="mb-8 p-6 rounded-xl border border-gray-200 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Address' : 'New Address'}
              </h2>
              <button type="button" onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              {['Home', 'Office', 'Other'].map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, label: lbl }))}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    form.label === lbl
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {lbl === 'Home' ? <FiHome className="w-4 h-4 inline mr-1" /> : lbl === 'Office' ? <FiBriefcase className="w-4 h-4 inline mr-1" /> : null}
                  {lbl}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Full Name</label>
                <input type="text" value={form.fullName} onChange={handleChange('fullName')} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={handleChange('phone')} className="input-field" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Address Line 1</label>
              <input type="text" value={form.addressLine1} onChange={handleChange('addressLine1')} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Address Line 2 (optional)</label>
              <input type="text" value={form.addressLine2} onChange={handleChange('addressLine2')} className="input-field" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">City</label>
                <input type="text" value={form.city} onChange={handleChange('city')} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">State</label>
                <input type="text" value={form.state} onChange={handleChange('state')} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">ZIP Code</label>
                <input type="text" value={form.postalCode} onChange={handleChange('postalCode')} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Country</label>
                <select value={form.country} onChange={handleChange('country')} className="input-field">
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={handleChange('isDefault')} className="rounded border-gray-300" />
              Set as default address
            </label>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Save'} Address</button>
              <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <FiMapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses saved</h3>
          <p className="text-gray-500 mb-4">Add an address for faster checkout</p>
          <button onClick={openAddForm} className="btn-primary">
            <FiPlus className="w-4 h-4 mr-1" /> Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border-2 relative transition-colors ${
                addr.isDefault ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <FiStar className="w-3 h-3" /> Default
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <FiMapPin className={`w-5 h-5 ${addr.isDefault ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className="font-medium text-gray-900">{addr.label || 'Address'}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">{addr.fullName}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                <p>{addr.country}</p>
                {addr.phone && <p className="pt-1">{addr.phone}</p>}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditForm(addr)}
                  className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FiEdit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <FiTrash2 className="w-3.5 h-3.5" /> Delete
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium ml-auto"
                  >
                    <FiStar className="w-3.5 h-3.5" /> Set Default
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
