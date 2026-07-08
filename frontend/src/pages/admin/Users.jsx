import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEdit2, FiTrash2, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const roleColors = {
  SUPER_ADMIN: 'bg-red-100 text-red-800',
  STORE_OWNER: 'bg-blue-100 text-blue-800',
  STORE_STAFF: 'bg-purple-100 text-purple-800',
  CUSTOMER: 'bg-green-100 text-green-800',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setPage(1); }, [search, roleFilter]);

  async function handleUpdateRole(userId, role) {
    setSaving(true);
    try {
      await api.put(`/admin/users/${userId}`, { role });
      toast.success('User role updated');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(userId, currentStatus) {
    setSaving(true);
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userId) {
    setSaving(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
        <button onClick={fetchUsers} className="btn-secondary p-2 rounded-lg">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="STORE_OWNER">Store Owner</option>
          <option value="STORE_STAFF">Store Staff</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary-50 text-left text-secondary-600">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-secondary-400">No users found</td></tr>
                  ) : (
                    users.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs mr-3">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <span className="font-medium text-secondary-900">{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-secondary-600">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role?.name] || ''}`}>
                            {user.role?.name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-secondary-500 text-xs">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => setEditUser(user)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="Edit">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(user)} className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 ml-1 transition-colors" title="Delete">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-secondary-500">{total} total users</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 rounded-lg disabled:opacity-50"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-secondary-600 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 rounded-lg disabled:opacity-50"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-secondary-900">Edit User</h2>
                <button onClick={() => setEditUser(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Name</label>
                  <p className="text-secondary-900 font-medium">{editUser.firstName} {editUser.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                  <p className="text-secondary-600">{editUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Role</label>
                  <select
                    value={editUser.role?.name}
                    onChange={(e) => setEditUser({ ...editUser, role: { ...editUser.role, name: e.target.value } })}
                    className="input w-full"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="STORE_STAFF">Store Staff</option>
                    <option value="STORE_OWNER">Store Owner</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-secondary-700">Account Status</p>
                    <p className="text-xs text-secondary-500">{editUser.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(editUser.id, editUser.isActive)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${editUser.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {editUser.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                  <button onClick={() => setEditUser(null)} className="btn-secondary px-4 py-2 rounded-lg">Cancel</button>
                  <button
                    onClick={() => handleUpdateRole(editUser.id, editUser.role?.name)}
                    disabled={saving}
                    className="btn-primary px-4 py-2 rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTrash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Delete User</h2>
                <p className="text-sm text-secondary-500 mb-6">
                  Are you sure you want to delete <strong>{deleteConfirm.firstName} {deleteConfirm.lastName}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary px-4 py-2 rounded-lg">Cancel</button>
                  <button
                    onClick={() => handleDelete(deleteConfirm.id)}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Deleting...' : 'Delete User'}
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
