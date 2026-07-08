import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiShield, FiEdit2, FiX, FiCheck, FiLock, FiUnlock } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const resources = ['users', 'stores', 'products', 'orders', 'payments', 'support', 'settings', 'roles'];
const actions = ['create', 'read', 'update', 'delete'];

const defaultPermissions = {
  SUPER_ADMIN: { create: true, read: true, update: true, delete: true },
  STORE_OWNER: { create: true, read: true, update: true, delete: true },
  STORE_STAFF: { create: false, read: true, update: true, delete: false },
  CUSTOMER: { create: false, read: true, update: false, delete: false },
};

const roleColors = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  STORE_OWNER: 'bg-blue-100 text-blue-800',
  STORE_STAFF: 'bg-purple-100 text-purple-800',
  CUSTOMER: 'bg-green-100 text-green-800',
};

const systemRoles = ['SUPER_ADMIN', 'CUSTOMER'];

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [editPermissions, setEditPermissions] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/roles');
      setRoles(data.data);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  function openEdit(role) {
    setEditingRole(role);
    setEditPermissions(JSON.parse(JSON.stringify(role.permissions || defaultPermissions[role.name] || {})));
  }

  async function handleSavePermissions() {
    setSaving(true);
    try {
      await api.put(`/admin/roles/${editingRole.id}`, { permissions: editPermissions });
      toast.success('Permissions updated');
      setEditingRole(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  }

  function togglePermission(resource, action) {
    setEditPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...(prev[resource] || { create: false, read: false, update: false, delete: false }),
        [action]: !((prev[resource] || {})[action]),
      },
    }));
  }

  function hasPermission(role, resource, action) {
    return role?.permissions?.[resource]?.[action] || defaultPermissions[role.name]?.[action] || false;
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Roles & Permissions</h1>
        <button onClick={fetchRoles} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {roles.map((role, i) => (
          <motion.div key={role.id || role.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${roleColors[role.name] || 'bg-gray-100'}`}>
                  <FiShield className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-secondary-900">{role.name?.replace('_', ' ')}</h3>
                  <p className="text-xs text-secondary-500">{role._count?.users || 0} users</p>
                </div>
              </div>
              {!systemRoles.includes(role.name) && (
                <button onClick={() => openEdit(role)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="Edit Permissions"><FiEdit2 className="w-4 h-4" /></button>
              )}
            </div>
            {systemRoles.includes(role.name) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-600"><FiLock className="w-3 h-3 mr-1" />System Role</span>
            )}
            <div className="mt-3 space-y-1">
              {resources.slice(0, 4).map((res) => {
                const perms = role.permissions?.[res] || defaultPermissions[role.name] || {};
                const enabledCount = Object.values(perms).filter(Boolean).length;
                return (
                  <div key={res} className="flex items-center justify-between text-xs">
                    <span className="text-secondary-600 capitalize">{res}</span>
                    <span className="text-secondary-400">{enabledCount}/{actions.length}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">Permission Matrix</h2>
          <p className="text-sm text-secondary-500">Overview of all roles and their resource permissions</p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary-600">
                <th className="p-3 font-medium">Resource</th>
                {roles.map((role) => (
                  <th key={role.id || role.name} className="p-3 font-medium text-center" colSpan={4}>{role.name?.replace('_', ' ')}</th>
                ))}
              </tr>
              <tr className="text-left text-secondary-500">
                <th className="p-2" />
                {roles.map((role) => actions.map((act) => (
                  <th key={`${role.id}-${act}`} className="p-2 text-center text-xs font-medium capitalize">{act}</th>
                )))}
              </tr>
            </thead>
            <tbody>
              {resources.map((resource, ri) => (
                <motion.tr key={resource} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ri * 0.02 }} className="border-t border-secondary-100">
                  <td className="p-3 font-medium text-secondary-900 capitalize">{resource}</td>
                  {roles.map((role) => actions.map((action) => {
                    const allowed = hasPermission(role, resource, action);
                    return (
                      <td key={`${role.id}-${resource}-${action}`} className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${allowed ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                          {allowed ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                        </span>
                      </td>
                    );
                  }))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {editingRole && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingRole(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${roleColors[editingRole.name] || 'bg-gray-100'}`}><FiShield className="w-5 h-5" /></div>
                  <h2 className="text-lg font-semibold text-secondary-900 ml-3">{editingRole.name?.replace('_', ' ')} Permissions</h2>
                </div>
                <button onClick={() => setEditingRole(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-secondary-600 border-b border-secondary-200">
                        <th className="p-3 font-medium">Resource</th>
                        {actions.map((act) => <th key={act} className="p-3 font-medium text-center capitalize">{act}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource, ri) => (
                        <tr key={resource} className={ri < resources.length - 1 ? 'border-b border-secondary-100' : ''}>
                          <td className="p-3 font-medium text-secondary-900 capitalize">{resource}</td>
                          {actions.map((action) => {
                            const allowed = editPermissions[resource]?.[action] ?? defaultPermissions[editingRole.name]?.[action] ?? false;
                            return (
                              <td key={action} className="p-3 text-center">
                                <button type="button" onClick={() => togglePermission(resource, action)} className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center mx-auto ${allowed ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                                  {allowed ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-secondary-200">
                  <button onClick={() => setEditingRole(null)} className="btn-secondary px-4 py-2 rounded-lg">Cancel</button>
                  <button onClick={handleSavePermissions} disabled={saving} className="btn-primary px-4 py-2 rounded-lg">{saving ? 'Saving...' : 'Save Permissions'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
