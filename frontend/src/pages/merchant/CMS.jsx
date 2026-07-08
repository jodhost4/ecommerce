import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiEye, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiFileText, FiCheckCircle, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDateTime } from '../../utils/formatters';

const PAGE_TEMPLATES = [
  { key: 'about-us', label: 'About Us', defaultTitle: 'About Us' },
  { key: 'contact', label: 'Contact', defaultTitle: 'Contact Us' },
  { key: 'privacy-policy', label: 'Privacy Policy', defaultTitle: 'Privacy Policy' },
  { key: 'terms', label: 'Terms & Conditions', defaultTitle: 'Terms & Conditions' },
  { key: 'faq', label: 'FAQ', defaultTitle: 'Frequently Asked Questions' },
  { key: 'return-policy', label: 'Return Policy', defaultTitle: 'Return Policy' },
];

export default function CMS() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [editorContent, setEditorContent] = useState({ title: '', content: '', slug: '', isPublished: true });
  const [saving, setSaving] = useState(false);
  const [previewPage, setPreviewPage] = useState(null);

  useEffect(() => {
    fetchPages();
  }, [page]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get('/cms-pages', { params });
      setPages(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load CMS pages');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (cmsPage = null) => {
    if (cmsPage) {
      setEditingPage(cmsPage);
      setEditorContent({
        title: cmsPage.title || '',
        content: cmsPage.content || '',
        slug: cmsPage.slug || '',
        isPublished: cmsPage.isPublished,
      });
    } else {
      setEditingPage(null);
      setEditorContent({ title: '', content: '', slug: '', isPublished: true });
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!editorContent.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: editorContent.title,
        content: editorContent.content,
        slug: editorContent.slug || editorContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        isPublished: editorContent.isPublished,
      };
      if (editingPage) {
        await api.put(`/cms-pages/${editingPage.id}`, payload);
        toast.success('Page updated');
      } else {
        await api.post('/cms-pages', payload);
        toast.success('Page created');
      }
      setShowEditor(false);
      setEditingPage(null);
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (cmsPage) => {
    try {
      await api.put(`/cms-pages/${cmsPage.id}`, { isPublished: !cmsPage.isPublished });
      toast.success(`Page ${cmsPage.isPublished ? 'unpublished' : 'published'}`);
      fetchPages();
    } catch {
      toast.error('Failed to update page');
    }
  };

  const createFromTemplate = async (template) => {
    setEditingPage(null);
    setEditorContent({
      title: template.defaultTitle,
      content: '',
      slug: template.key,
      isPublished: true,
    });
    setShowEditor(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">CMS Pages</h1>
        <div className="flex items-center space-x-2">
          <div className="relative group">
            <button className="btn-primary flex items-center space-x-2">
              <FiPlus className="w-4 h-4" /><span>New Page</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {PAGE_TEMPLATES.map((t) => (
                <button key={t.key} onClick={() => createFromTemplate(t)} className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 first:rounded-t-lg last:rounded-b-lg">
                  {t.label}
                </button>
              ))}
              <div className="border-t border-secondary-100" />
              <button onClick={() => openEditor()} className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-b-lg">
                Blank Page
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input type="text" placeholder="Search pages..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchPages())} className="input-field pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full"><LoadingSpinner /></div>
        ) : pages.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <FiFileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500 mb-4">No CMS pages yet</p>
            <p className="text-sm text-secondary-400">Create pages from templates or start from scratch</p>
          </div>
        ) : (
          pages.map((cmsPage, i) => (
            <motion.div
              key={cmsPage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2 rounded-lg ${cmsPage.isPublished ? 'bg-green-100' : 'bg-secondary-100'}`}>
                    <FiFileText className={`w-5 h-5 ${cmsPage.isPublished ? 'text-green-600' : 'text-secondary-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-secondary-900 truncate">{cmsPage.title}</h3>
                    <p className="text-xs text-secondary-500 truncate">/{cmsPage.slug}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${cmsPage.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {cmsPage.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-secondary-400 mb-3 line-clamp-2">{cmsPage.content ? cmsPage.content.substring(0, 100) : 'No content yet'}</p>
              <div className="flex items-center justify-between text-xs text-secondary-400 mb-3">
                <span className="flex items-center space-x-1"><FiClock className="w-3 h-3" /><span>Updated {cmsPage.updatedAt ? formatDateTime(cmsPage.updatedAt) : '—'}</span></span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                <div className="flex items-center space-x-1">
                  <button onClick={() => handleTogglePublished(cmsPage)} className={`p-1.5 rounded transition-colors ${cmsPage.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-secondary-100'}`} title={cmsPage.isPublished ? 'Unpublish' : 'Publish'}>
                    {cmsPage.isPublished ? <FiCheckCircle className="w-4 h-4" /> : <FiClock className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setPreviewPage(cmsPage)} className="p-1.5 rounded text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100" title="Preview">
                    <FiEye className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => openEditor(cmsPage)} className="btn-secondary p-1.5 text-xs flex items-center space-x-1">
                  <FiEdit2 className="w-3 h-3" /><span>Edit</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4 bg-white rounded-lg border border-secondary-200">
          <p className="text-sm text-secondary-600">Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="btn-secondary p-2 disabled:opacity-50"><FiChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-secondary-400">...</span>}
                  <button onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md ${p === pagination.page ? 'bg-primary-600 text-white' : 'text-secondary-600 hover:bg-secondary-200'}`}>{p}</button>
                </span>
              ))}
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="btn-secondary p-2 disabled:opacity-50"><FiChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowEditor(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                <h2 className="text-lg font-semibold text-secondary-900">{editingPage ? 'Edit Page' : 'Create Page'}</h2>
                <button onClick={() => { setShowEditor(false); setEditingPage(null); }} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Title *</label>
                  <input type="text" value={editorContent.title} onChange={(e) => setEditorContent((p) => ({ ...p, title: e.target.value }))} className="input-field" placeholder="Page Title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Slug</label>
                  <input type="text" value={editorContent.slug} onChange={(e) => setEditorContent((p) => ({ ...p, slug: e.target.value }))} className="input-field" placeholder="page-slug" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Content</label>
                  <textarea
                    value={editorContent.content}
                    onChange={(e) => setEditorContent((p) => ({ ...p, content: e.target.value }))}
                    rows={12}
                    className="input-field font-mono text-sm resize-y"
                    placeholder="Page content (HTML or Markdown)..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isPublished" checked={editorContent.isPublished} onChange={(e) => setEditorContent((p) => ({ ...p, isPublished: e.target.checked }))} className="rounded border-secondary-300 text-primary-600" />
                  <label htmlFor="isPublished" className="text-sm text-secondary-700">Published</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 p-6 border-t border-secondary-200">
                <button onClick={() => { setShowEditor(false); setEditingPage(null); }} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingPage ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {previewPage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setPreviewPage(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-secondary-200 sticky top-0 bg-white">
                <h2 className="text-lg font-semibold text-secondary-900">Preview: {previewPage.title}</h2>
                <button onClick={() => setPreviewPage(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <h1 className="text-2xl font-bold text-secondary-900 mb-6">{previewPage.title}</h1>
                <div className="prose max-w-none text-secondary-700 whitespace-pre-wrap">
                  {previewPage.content || <p className="text-secondary-400 italic">No content</p>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
