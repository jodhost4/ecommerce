import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiMapPin, FiTruck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

export default function Shipping() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedZone, setExpandedZone] = useState(null);
  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipping/zones');
      setZones(res.data.data);
    } catch {
      toast.error('Failed to load shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async (zoneId) => {
    setLoadingRates(true);
    try {
      const res = await api.get(`/shipping/zones/${zoneId}/rates`);
      setRates(res.data.data);
    } catch {
      toast.error('Failed to load rates');
    } finally {
      setLoadingRates(false);
    }
  };

  const toggleZone = (zoneId) => {
    if (expandedZone === zoneId) {
      setExpandedZone(null);
      setRates([]);
      return;
    }
    setExpandedZone(zoneId);
    fetchRates(zoneId);
  };

  const handleSaveZone = async () => {
    try {
      const payload = {
        name: editingZone.name,
        countries: editingZone.countries || [],
        regions: editingZone.regions || [],
      };
      if (editingZone.id) {
        await api.put(`/shipping/zones/${editingZone.id}`, { ...payload, isActive: editingZone.isActive });
        toast.success('Zone updated');
      } else {
        await api.post('/shipping/zones', payload);
        toast.success('Zone created');
      }
      setShowZoneModal(false);
      setEditingZone(null);
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save zone');
    }
  };

  const handleDeleteZone = async (id) => {
    if (!confirm('Delete this shipping zone?')) return;
    try {
      await api.delete(`/shipping/zones/${id}`);
      toast.success('Zone deleted');
      fetchZones();
    } catch {
      toast.error('Failed to delete zone');
    }
  };

  const handleSaveRate = async () => {
    try {
      const payload = {
        name: editingRate.name,
        type: editingRate.type || 'FLAT',
        baseRate: parseFloat(editingRate.baseRate) || 0,
        perRate: parseFloat(editingRate.perRate) || 0,
        minValue: editingRate.minValue ? parseFloat(editingRate.minValue) : undefined,
        maxValue: editingRate.maxValue ? parseFloat(editingRate.maxValue) : undefined,
        minWeight: editingRate.minWeight ? parseFloat(editingRate.minWeight) : undefined,
        maxWeight: editingRate.maxWeight ? parseFloat(editingRate.maxWeight) : undefined,
        estimatedDaysMin: editingRate.estimatedDaysMin ? parseInt(editingRate.estimatedDaysMin) : undefined,
        estimatedDaysMax: editingRate.estimatedDaysMax ? parseInt(editingRate.estimatedDaysMax) : undefined,
      };
      if (editingRate.id) {
        await api.put(`/shipping/rates/${editingRate.id}`, { ...payload, isActive: editingRate.isActive });
        toast.success('Rate updated');
      } else {
        await api.post(`/shipping/zones/${selectedZoneId}/rates`, payload);
        toast.success('Rate created');
      }
      setShowRateModal(false);
      setEditingRate(null);
      if (expandedZone) fetchRates(expandedZone);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rate');
    }
  };

  const handleDeleteRate = async (id) => {
    if (!confirm('Delete this shipping rate?')) return;
    try {
      await api.delete(`/shipping/rates/${id}`);
      toast.success('Rate deleted');
      if (expandedZone) fetchRates(expandedZone);
    } catch {
      toast.error('Failed to delete rate');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Shipping</h1>
        <button onClick={() => { setEditingZone({ name: '', countries: [], regions: [] }); setShowZoneModal(true); }} className="btn-primary flex items-center space-x-2">
          <FiPlus className="w-4 h-4" /><span>Add Zone</span>
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {zones.length === 0 ? (
            <div className="card p-12 text-center">
              <FiMapPin className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-500">No shipping zones configured</p>
            </div>
          ) : (
            zones.map((zone) => (
              <motion.div key={zone.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleZone(zone.id)}>
                  <div className="flex items-center space-x-3">
                    <FiMapPin className="w-5 h-5 text-primary-500" />
                    <div>
                      <h3 className="font-semibold text-secondary-900">{zone.name}</h3>
                      <p className="text-xs text-secondary-500">{zone.countries?.length || 0} countries &middot; {zone._count?.rates || 0} rates</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${zone.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditingZone(zone); setShowZoneModal(true); }} className="p-1.5 hover:bg-secondary-100 rounded"><FiEdit2 className="w-4 h-4 text-secondary-500" /></button>
                      <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 hover:bg-secondary-100 rounded"><FiTrash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                    {expandedZone === zone.id ? <FiChevronDown className="w-5 h-5 text-secondary-400" /> : <FiChevronRight className="w-5 h-5 text-secondary-400" />}
                  </div>
                </div>
                {zone.countries?.length > 0 && (
                  <div className="px-5 pb-3 flex flex-wrap gap-1">
                    {zone.countries.map((c) => <span key={c} className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded">{c}</span>)}
                  </div>
                )}

                <AnimatePresence>
                  {expandedZone === zone.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-secondary-100">
                      <div className="p-4 bg-secondary-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-secondary-700">Shipping Rates</h4>
                          <button onClick={() => { setSelectedZoneId(zone.id); setEditingRate({ name: '', type: 'FLAT', baseRate: '', perRate: '0', minValue: '', maxValue: '', minWeight: '', maxWeight: '', estimatedDaysMin: '', estimatedDaysMax: '' }); setShowRateModal(true); }} className="btn-primary text-xs px-3 py-1.5 flex items-center space-x-1">
                            <FiPlus className="w-3 h-3" /><span>Add Rate</span>
                          </button>
                        </div>
                        {loadingRates ? <LoadingSpinner /> : rates.length === 0 ? (
                          <p className="text-sm text-secondary-500 text-center py-4">No rates configured</p>
                        ) : (
                          <div className="space-y-2">
                            {rates.map((rate) => (
                              <div key={rate.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-secondary-200">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-secondary-900">{rate.name}</span>
                                    <span className="text-xs bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded">{rate.type}</span>
                                  </div>
                                  <div className="flex items-center space-x-3 mt-1 text-xs text-secondary-500">
                                    <span>Base: {formatCurrency(Number(rate.baseRate))}</span>
                                    {Number(rate.perRate) > 0 && <span>Per unit: {formatCurrency(Number(rate.perRate))}</span>}
                                    {rate.minValue && <span>Min: {formatCurrency(Number(rate.minValue))}</span>}
                                    {rate.maxValue && <span>Max: {formatCurrency(Number(rate.maxValue))}</span>}
                                    {rate.estimatedDaysMin && <span>ETA: {rate.estimatedDaysMin}-{rate.estimatedDaysMax} days</span>}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${rate.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {rate.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <button onClick={() => { setEditingRate(rate); setShowRateModal(true); }} className="p-1.5 hover:bg-secondary-100 rounded"><FiEdit2 className="w-3.5 h-3.5 text-secondary-500" /></button>
                                  <button onClick={() => handleDeleteRate(rate.id)} className="p-1.5 hover:bg-secondary-100 rounded"><FiTrash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {showZoneModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowZoneModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">{editingZone?.id ? 'Edit Zone' : 'Add Zone'}</h2>
                <button onClick={() => setShowZoneModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Zone Name</label>
                  <input type="text" value={editingZone?.name || ''} onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Countries (one per line)</label>
                  <textarea value={(editingZone?.countries || []).join('\n')} onChange={(e) => setEditingZone({ ...editingZone, countries: e.target.value.split('\n').filter(Boolean) })} className="input-field min-h-[100px]" placeholder="US&#10;CA&#10;GB" />
                </div>
                {editingZone?.id && (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="zoneActive" checked={editingZone.isActive} onChange={(e) => setEditingZone({ ...editingZone, isActive: e.target.checked })} className="rounded border-secondary-300" />
                    <label htmlFor="zoneActive" className="text-sm text-secondary-700">Active</label>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowZoneModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSaveZone} className="btn-primary px-4 py-2">{editingZone?.id ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showRateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRateModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">{editingRate?.id ? 'Edit Rate' : 'Add Rate'}</h2>
                <button onClick={() => setShowRateModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Rate Name</label>
                  <input type="text" value={editingRate?.name || ''} onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Type</label>
                  <select value={editingRate?.type || 'FLAT'} onChange={(e) => setEditingRate({ ...editingRate, type: e.target.value })} className="input-field">
                    <option value="FLAT">Flat Rate</option>
                    <option value="WEIGHT">Weight Based</option>
                    <option value="VALUE">Value Based</option>
                    <option value="FREE">Free Shipping</option>
                  </select>
                </div>
                <div></div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Base Rate</label>
                  <input type="number" step="0.01" value={editingRate?.baseRate || ''} onChange={(e) => setEditingRate({ ...editingRate, baseRate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Per Unit Rate</label>
                  <input type="number" step="0.01" value={editingRate?.perRate || '0'} onChange={(e) => setEditingRate({ ...editingRate, perRate: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Min Order Value</label>
                  <input type="number" step="0.01" value={editingRate?.minValue || ''} onChange={(e) => setEditingRate({ ...editingRate, minValue: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Max Order Value</label>
                  <input type="number" step="0.01" value={editingRate?.maxValue || ''} onChange={(e) => setEditingRate({ ...editingRate, maxValue: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Min Weight</label>
                  <input type="number" step="0.01" value={editingRate?.minWeight || ''} onChange={(e) => setEditingRate({ ...editingRate, minWeight: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Max Weight</label>
                  <input type="number" step="0.01" value={editingRate?.maxWeight || ''} onChange={(e) => setEditingRate({ ...editingRate, maxWeight: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Est. Days Min</label>
                  <input type="number" value={editingRate?.estimatedDaysMin || ''} onChange={(e) => setEditingRate({ ...editingRate, estimatedDaysMin: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Est. Days Max</label>
                  <input type="number" value={editingRate?.estimatedDaysMax || ''} onChange={(e) => setEditingRate({ ...editingRate, estimatedDaysMax: e.target.value })} className="input-field" />
                </div>
                {editingRate?.id && (
                  <div className="col-span-2 flex items-center space-x-2">
                    <input type="checkbox" id="rateActive" checked={editingRate.isActive} onChange={(e) => setEditingRate({ ...editingRate, isActive: e.target.checked })} className="rounded border-secondary-300" />
                    <label htmlFor="rateActive" className="text-sm text-secondary-700">Active</label>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowRateModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSaveRate} className="btn-primary px-4 py-2">{editingRate?.id ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
