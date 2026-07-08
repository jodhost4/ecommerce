import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { THEME_PRESETS } from '../../utils/constants';
import authStore from '../../store/authStore';

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
];

export default function StoreTheme() {
  const storeId = authStore.user?.ownedStore?.id;
  const storeSlug = authStore.user?.ownedStore?.slug;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [theme, setTheme] = useState({
    name: 'Custom',
    colors: { primary: '#3b82f6', secondary: '#10b981', background: '#ffffff', text: '#1e293b' },
    fonts: { heading: 'Inter', body: 'Inter' },
    layout: { style: 'standard', sidebar: false, homepage: 'default' },
  });

  useEffect(() => {
    fetchTheme();
  }, [storeId]);

  async function fetchTheme() {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/stores/${storeId}/theme`);
      const t = data.data;
      setTheme({
        name: t.name || 'Custom',
        colors: t.colors || { primary: '#3b82f6', secondary: '#10b981', background: '#ffffff', text: '#1e293b' },
        fonts: t.fonts || { heading: 'Inter', body: 'Inter' },
        layout: t.layout || { style: 'standard', sidebar: false, homepage: 'default' },
      });
    } catch {
      toast.error('Failed to load theme');
    } finally {
      setLoading(false);
    }
  }

  function updateColor(key, value) {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  }

  function updateFont(key, value) {
    setTheme((prev) => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));
  }

  function updateLayout(key, value) {
    setTheme((prev) => ({ ...prev, layout: { ...prev.layout, [key]: value } }));
  }

  function applyPreset(preset) {
    setTheme((prev) => ({
      ...prev,
      name: preset.name,
      colors: { ...prev.colors, ...preset.colors },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/stores/${storeId}/theme`, {
        name: theme.name,
        colors: theme.colors,
        fonts: theme.fonts,
        layout: theme.layout,
      });
      toast.success('Theme saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save theme');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Theme Customization</h1>
          {storeSlug && (
            <a href={`/store/${storeSlug}/home`} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1 mt-1">
              <FiExternalLink className="w-3 h-3" /> Preview Store
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTheme} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-4 h-4" /></button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg">
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Colors</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'primary', label: 'Primary' },
                { key: 'secondary', label: 'Secondary' },
                { key: 'background', label: 'Background' },
                { key: 'text', label: 'Text' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-secondary-300"
                    />
                    <input
                      type="text"
                      value={theme.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="input flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Typography</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Heading Font</label>
                <select value={theme.fonts.heading} onChange={(e) => updateFont('heading', e.target.value)} className="input w-full">
                  {fontOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Body Font</label>
                <select value={theme.fonts.body} onChange={(e) => updateFont('body', e.target.value)} className="input w-full">
                  {fontOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Layout</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Layout Style</label>
                <select value={theme.layout.style} onChange={(e) => updateLayout('style', e.target.value)} className="input w-full">
                  <option value="standard">Standard</option>
                  <option value="minimal">Minimal</option>
                  <option value="bold">Bold</option>
                  <option value="elegant">Elegant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Homepage</label>
                <select value={theme.layout.homepage} onChange={(e) => updateLayout('homepage', e.target.value)} className="input w-full">
                  <option value="default">Default</option>
                  <option value="hero">Hero Focus</option>
                  <option value="grid">Product Grid</option>
                  <option value="list">Product List</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={theme.layout.sidebar} onChange={(e) => updateLayout('sidebar', e.target.checked)} className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-700">Show Sidebar</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Presets</h2>
            <div className="grid grid-cols-2 gap-3">
              {THEME_PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyPreset(preset)}
                  className="p-3 rounded-lg border border-secondary-200 hover:border-primary-300 transition-colors text-left"
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.background, border: '1px solid #e2e8f0' }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.colors.text }} />
                  </div>
                  <p className="text-sm font-medium text-secondary-900">{preset.name}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Preview</h2>
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.text + '20',
              }}
            >
              <h3
                className="text-xl font-bold mb-3"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                }}
              >
                Store Preview
              </h3>
              <div className="flex gap-2 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Shop Now
                </span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: theme.colors.secondary }}
                >
                  Sale
                </span>
              </div>
              <p
                className="text-sm mb-3"
                style={{
                  color: theme.colors.text + 'cc',
                  fontFamily: theme.fonts.body,
                }}
              >
                This is how your store will look with the current theme settings. Colors, fonts, and layout are reflected in real-time.
              </p>
              <div
                className="h-2 rounded-full mb-2"
                style={{ backgroundColor: theme.colors.primary + '30' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '60%',
                    backgroundColor: theme.colors.primary,
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg"
                    style={{
                      backgroundColor: theme.colors.primary + '15',
                      border: `1px solid ${theme.colors.text}10`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
