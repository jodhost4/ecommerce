import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSearch, FiBox, FiAlertTriangle, FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const statusBadge = (qty, threshold) => {
  if (qty <= 0) return { label: 'Out of Stock', class: 'bg-gray-100 text-gray-800 border-gray-200' };
  if (qty <= threshold) return { label: 'Low Stock', class: 'bg-red-100 text-red-800 border-red-200' };
  return { label: 'In Stock', class: 'bg-green-100 text-green-800 border-green-200' };
};

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockForm, setStockForm] = useState({ action: 'add', quantity: 1, reason: '' });

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: FiBox },
    { id: 'warehouses', label: 'Warehouses', icon: FiMapPin },
  ];

  useEffect(() => {
    if (activeTab === 'inventory') fetchInventory();
    else fetchWarehouses();
  }, [activeTab, page, warehouseFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search && activeTab === 'inventory') fetchInventory();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (warehouseFilter) params.warehouseId = warehouseFilter;
      const res = await api.get('/inventory', { params });
      setInventory(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/warehouses');
      setWarehouses(res.data.data);
    } catch {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjust = async () => {
    try {
      await api.put('/inventory/stock', {
        productId: selectedItem.productId,
        variantId: selectedItem.variantId || null,
        warehouseId: selectedItem.warehouseId,
        action: stockForm.action,
        quantity: stockForm.quantity,
        reason: stockForm.reason,
      });
      toast.success('Stock updated');
      setShowStockModal(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleSaveWarehouse = async () => {
    try {
      if (editingWarehouse?.id) {
        await api.put(`/inventory/warehouses/${editingWarehouse.id}`, editingWarehouse);
        toast.success('Warehouse updated');
      } else {
        await api.post('/inventory/warehouses', editingWarehouse);
        toast.success('Warehouse created');
      }
      setShowWarehouseModal(false);
      setEditingWarehouse(null);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save warehouse');
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      await api.delete(`/inventory/warehouses/${id}`);
      toast.success('Warehouse deleted');
      fetchWarehouses();
    } catch {
      toast.error('Failed to delete warehouse');
    }
  };

  const totalProducts = inventory.length;
  const lowStockCount = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
  const totalValue = inventory.reduce((sum, i) => sum + Number(i.product?.basePrice || 0) * i.quantity, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Inventory</h1>
      </div>

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Products', value: totalProducts, icon: FiBox, color: 'bg-blue-500' },
              { label: 'Low Stock Items', value: lowStockCount, icon: FiAlertTriangle, color: 'bg-red-500' },
              { label: 'Total Value', value: formatCurrency(totalValue), icon: FiDollarSign, color: 'bg-green-500' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-5 flex items-center"
              >
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-xs text-secondary-500">{card.label}</p>
                  <p className="text-xl font-bold text-secondary-900">{card.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="card p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={warehouseFilter}
                onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
                className="input-field min-w-[180px]"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-50 border-b border-secondary-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">SKU</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Warehouse</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Quantity</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Reserved</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Available</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-12"><LoadingSpinner /></td></tr>
                  ) : inventory.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-secondary-500">No inventory records found</td></tr>
                  ) : (
                    inventory.map((item, i) => {
                      const badge = statusBadge(item.quantity, item.lowStockThreshold);
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-secondary-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.product?.images?.[0]?.url ? (
                                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-secondary-400"><FiBox className="w-5 h-5" /></div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-secondary-900">{item.product?.name}</p>
                                {item.variant && <p className="text-xs text-secondary-500">{item.variant.name}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.variant?.sku || item.product?.sku}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.warehouse?.name || 'Default'}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-secondary-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-secondary-600">{item.reserved}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-secondary-900">{item.available}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setSelectedItem(item); setStockForm({ action: 'add', quantity: 1, reason: '' }); setShowStockModal(true); }}
                              className="btn-secondary p-2"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
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
        </>
      )}

      {activeTab === 'warehouses' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditingWarehouse({ name: '', address: '', city: '', state: '', country: '', zipCode: '' }); setShowWarehouseModal(true); }} className="btn-primary flex items-center space-x-2">
              <FiPlus className="w-4 h-4" />
              <span>Add Warehouse</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <LoadingSpinner /> : warehouses.length === 0 ? (
              <p className="col-span-full text-center text-secondary-500 py-12">No warehouses found</p>
            ) : (
              warehouses.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-primary-100 rounded-lg">
                        <FiMapPin className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{w.name}</h3>
                        <p className="text-xs text-secondary-500">{w._count?.inventory || 0} products</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {w.address && <p className="mt-3 text-sm text-secondary-600">{w.address}{w.city ? `, ${w.city}` : ''}{w.state ? `, ${w.state}` : ''}</p>}
                  <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-secondary-100">
                    <button onClick={() => { setEditingWarehouse(w); setShowWarehouseModal(true); }} className="btn-secondary p-2 text-sm flex items-center space-x-1">
                      <FiEdit2 className="w-3.5 h-3.5" /><span>Edit</span>
                    </button>
                    <button onClick={() => handleDeleteWarehouse(w.id)} className="btn-secondary p-2 text-sm text-red-600 flex items-center space-x-1">
                      <FiTrash2 className="w-3.5 h-3.5" /><span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showStockModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowStockModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">Adjust Stock</h2>
                <button onClick={() => setShowStockModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              {selectedItem && (
                <div className="mb-4 p-3 bg-secondary-50 rounded-lg">
                  <p className="text-sm font-medium text-secondary-900">{selectedItem.product?.name}</p>
                  <p className="text-xs text-secondary-500">Current: {selectedItem.quantity} | Warehouse: {selectedItem.warehouse?.name}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Action</label>
                  <select value={stockForm.action} onChange={(e) => setStockForm({ ...stockForm, action: e.target.value })} className="input-field">
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                    <option value="set">Set Quantity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Quantity</label>
                  <input type="number" min={1} value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 0 })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
                  <input type="text" value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} className="input-field" placeholder="e.g. Stock count adjustment" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowStockModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleStockAdjust} className="btn-primary px-4 py-2">Update Stock</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showWarehouseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWarehouseModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">{editingWarehouse?.id ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
                <button onClick={() => setShowWarehouseModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Name</label>
                  <input type="text" value={editingWarehouse?.name || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Address</label>
                  <input type="text" value={editingWarehouse?.address || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, address: e.target.value })} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">City</label>
                    <input type="text" value={editingWarehouse?.city || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, city: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">State</label>
                    <input type="text" value={editingWarehouse?.state || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, state: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Country</label>
                    <input type="text" value={editingWarehouse?.country || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, country: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Zip Code</label>
                    <input type="text" value={editingWarehouse?.zipCode || ''} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, zipCode: e.target.value })} className="input-field" />
                  </div>
                </div>
                {editingWarehouse?.id && (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="isActive" checked={editingWarehouse.isActive} onChange={(e) => setEditingWarehouse({ ...editingWarehouse, isActive: e.target.checked })} className="rounded border-secondary-300" />
                    <label htmlFor="isActive" className="text-sm text-secondary-700">Active</label>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowWarehouseModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleSaveWarehouse} className="btn-primary px-4 py-2">{editingWarehouse?.id ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
