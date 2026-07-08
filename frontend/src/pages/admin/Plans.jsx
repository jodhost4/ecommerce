import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiRefreshCw, FiCheck, FiClock, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const initialForm = { name: '', price: '', interval: 'monthly', features: '', isActive: true };

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/plans');
      setPlans(data.data);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  function openCreate() {
    setEditingPlan(null);
    setForm(initialForm);
    setShowModal(true);
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''),
      isActive: plan.isActive,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      };
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/plans', payload);
        toast.success('Plan created');
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(plan) {
    try {
      await api.put(`/admin/plans/${plan.id}`, { isActive: !plan.isActive });
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle plan');
    }
  }

  async function handleDelete(planId) {
    setSaving(true);
    try {
      await api.delete(`/admin/plans/${planId}`);
      toast.success('Plan deleted');
      setDeleteConfirm(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    } finally {
      setSaving(false);
    }
  }

  const intervalIcons = { monthly: FiClock, yearly: FiDollarSign, weekly: FiClock, lifetime: FiCheck };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Subscription Plans</h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchPlans} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
          <button onClick={openCreate} className="btn-primary px-4 py-2 rounded-lg flex items-center"><FiPlus className="w-4 h-4 mr-2" />Create Plan</button>
        </div>
      </motion.div>

      {plans.length === 0 ? (
        <div className="card p-12 text-center">
          <FiDollarSign className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Plans Yet</h3>
          <p className="text-secondary-500 mb-6">Create your first subscription plan to get started.</p>
          <button onClick={openCreate} className="btn-primary px-6 py-2 rounded-lg">Create Plan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const IntervalIcon = intervalIcons[plan.interval] || FiClock;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`card p-6 relative ${!plan.isActive ? 'opacity-60' : ''}`}>
                {!plan.isActive && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Inactive</span>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${plan.isActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <IntervalIcon className={`w-6 h-6 ${plan.isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(plan)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(plan)} className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-secondary-900">${plan.price}</span>
                  <span className="text-sm text-secondary-500 ml-1">/{plan.interval}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {(Array.isArray(plan.features) ? plan.features : []).map((feature, fi) => (
                    <li key={fi} className="flex items-start text-sm text-secondary-600">
                      <FiCheck className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleToggleActive(plan)} className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${plan.isActive ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-900">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
                <button onClick={() => setShowModal(false)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Plan Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="e.g. Pro Plan" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Price ($)</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input w-full" placeholder="29.99" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Interval</label>
                    <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} className="input w-full">
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Features (comma separated)</label>
                  <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="input w-full h-24" placeholder="Unlimited products, Priority support, Custom domain" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium text-secondary-700">Active</label>
                  <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })} className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? 'bg-green-500' : 'bg-secondary-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2 rounded-lg">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg">{saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><FiTrash2 className="w-6 h-6 text-red-600" /></div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Delete Plan</h2>
                <p className="text-sm text-secondary-500 mb-6">Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary px-4 py-2 rounded-lg">Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm.id)} disabled={saving} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    {saving ? 'Deleting...' : 'Delete Plan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
