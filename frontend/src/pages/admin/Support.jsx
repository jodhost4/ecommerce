import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEye, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw, FiMessageSquare, FiMail, FiClock, FiCheck, FiSend } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusColors = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusOptions = ['open', 'in_progress', 'resolved', 'closed'];
const priorityOptions = ['', 'low', 'medium', 'high', 'urgent'];

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const { data } = await api.get('/admin/support/tickets', { params });
      setTickets(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  async function viewDetail(ticketId) {
    setDetailLoading(true);
    setSelectedTicket(null);
    try {
      const { data } = await api.get(`/admin/support/tickets/${ticketId}`);
      setSelectedTicket(data.data);
      setReplyText('');
    } catch (err) {
      toast.error('Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleUpdateStatus(ticketId, status) {
    try {
      await api.put(`/admin/support/tickets/${ticketId}`, { status });
      toast.success(`Ticket status updated to ${status.replace('_', ' ')}`);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    }
  }

  async function handleSendReply(ticketId) {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    setSending(true);
    try {
      await api.post(`/admin/support/tickets/${ticketId}/reply`, { message: replyText });
      toast.success('Reply sent');
      setReplyText('');
      viewDetail(ticketId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Support Tickets</h1>
        <button onClick={fetchTickets} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-5 h-5" /></button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
          <option value="">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input w-full sm:w-40">
          <option value="">All Priority</option>
          {priorityOptions.filter(Boolean).map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
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
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium">From</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Priority</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-secondary-400">No tickets found</td></tr>
                  ) : (
                    tickets.map((ticket, i) => (
                      <motion.tr key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-t border-secondary-100 hover:bg-secondary-50 transition-colors">
                        <td className="p-4 font-mono text-xs text-secondary-600">#{ticket.ticketNumber || ticket.id}</td>
                        <td className="p-4 font-medium text-secondary-900 max-w-[250px] truncate">{ticket.subject}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs mr-2">
                              {ticket.user?.firstName?.[0]}{ticket.user?.lastName?.[0]}
                            </div>
                            <span className="text-secondary-600">{ticket.user?.firstName} {ticket.user?.lastName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status] || ''}`}>
                            {ticket.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority] || ''}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="p-4 text-secondary-500 text-xs">{ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM d, yyyy') : '-'}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => viewDetail(ticket.id)} className="text-primary-600 hover:text-primary-700 p-1.5 rounded hover:bg-primary-50 transition-colors" title="View Details"><FiEye className="w-4 h-4" /></button>
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
              <p className="text-sm text-secondary-500">{total} total tickets</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 rounded-lg disabled:opacity-50"><FiChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm text-secondary-600 px-3">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 rounded-lg disabled:opacity-50"><FiChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">{selectedTicket.subject}</h2>
                  <p className="text-sm text-secondary-500">Ticket #{selectedTicket.ticketNumber || selectedTicket.id}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-wrap gap-3">
                  <select value={selectedTicket.status} onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)} className="input text-sm w-auto">
                    {statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                  </select>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${priorityColors[selectedTicket.priority] || ''}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="text-sm text-secondary-500 flex items-center"><FiClock className="w-4 h-4 mr-1" />{selectedTicket.createdAt ? format(new Date(selectedTicket.createdAt), 'MMM d, yyyy HH:mm') : '-'}</span>
                </div>

                <div className="space-y-4">
                  {(selectedTicket.messages || []).length === 0 ? (
                    <p className="text-center text-secondary-400 py-4">No messages yet</p>
                  ) : (
                    selectedTicket.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-xl ${msg.isAdmin ? 'bg-primary-50 text-primary-900' : 'bg-secondary-50 text-secondary-900'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.isAdmin ? 'Support Agent' : selectedTicket.user?.firstName || 'User'}</span>
                            <span className="text-xs text-secondary-400">{msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : ''}</span>
                          </div>
                          <p className="text-sm">{msg.content || msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div className="border-t border-secondary-200 pt-4">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="input w-full h-24 mb-3" placeholder="Type your reply..." />
                    <div className="flex justify-end">
                      <button onClick={() => handleSendReply(selectedTicket.id)} disabled={sending || !replyText.trim()} className="btn-primary px-4 py-2 rounded-lg flex items-center">
                        <FiSend className="w-4 h-4 mr-2" />{sending ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  );
}
