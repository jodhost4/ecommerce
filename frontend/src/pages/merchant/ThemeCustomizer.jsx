import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiRotateCcw, FiEye, FiType, FiLayout, FiGrid, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLOR_PRESETS = {
  Light: { primary: '#6366f1', secondary: '#ec4899', background: '#ffffff', text: '#1f2937' },
  Dark: { primary: '#818cf8', secondary: '#f472b6', background: '#111827', text: '#f9fafb' },
  Minimal: { primary: '#000000', secondary: '#6b7280', background: '#f9fafb', text: '#111827' },
  Nature: { primary: '#059669', secondary: '#d97706', background: '#f0fdf4', text: '#1f2937' },
};

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Merriweather', label: 'Merriweather' },
];

export default function ThemeCustomizer() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');

  const [theme, setTheme] = useState({
    colors: { primary: '#6366f1', secondary: '#ec4899', background: '#ffffff', text: '#1f2937' },
    fonts: { heading: 'Inter', body: 'Inter' },
    layout: { containerWidth: '1280', sidebarPosition: 'left' },
    header: { logoPosition: 'left', menuPosition: 'right' },
    footer: { columnCount: 4 },
    homepage: { showHero: true, showFeatured: true, showCategories: true, showTrending: true, showNewsletter: true },
    customCss: '',
  });

  useEffect(() => {
    api.get('/store-design/theme').then((res) => {
      if (res.data.data) {
        const data = res.data.data;
        setTheme(prev => ({
          ...prev,
          ...data,
          colors: data.colors || prev.colors,
          fonts: data.fonts || prev.fonts,
          layout: data.layout || prev.layout,
          header: data.header || prev.header,
          footer: data.footer || prev.footer,
          homepage: data.homepage || prev.homepage,
        }));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const updateTheme = (section, key, value) => {
    setTheme((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const applyPreset = (name) => {
    const preset = COLOR_PRESETS[name];
    setTheme((prev) => ({
      ...prev,
      colors: preset,
    }));
    toast.success(`Applied "${name}" preset`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/store-design/theme', theme);
      toast.success('Theme saved successfully');
    } catch {
      toast.error('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme({
      colors: { primary: '#6366f1', secondary: '#ec4899', background: '#ffffff', text: '#1f2937' },
      fonts: { heading: 'Inter', body: 'Inter' },
      layout: { containerWidth: '1280', sidebarPosition: 'left' },
      header: { logoPosition: 'left', menuPosition: 'right' },
      footer: { columnCount: 4 },
      homepage: { showHero: true, showFeatured: true, showCategories: true, showTrending: true, showNewsletter: true },
      customCss: '',
    });
    toast.success('Theme reset to defaults');
  };

  if (loading) return <LoadingSpinner />;

  const Input = ({ label, value, onChange, type = 'text', options, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'color' ? (
        <div className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer" />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input-field flex-1 font-mono text-sm" />
        </div>
      ) : type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">
          {(options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'toggle' ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-5' : ''}`} />
        </button>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" {...props} />
      )}
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div className="p-4 rounded-xl border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary-600" /> {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Theme Customizer</h1>
        <div className="flex items-center gap-3">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button onClick={() => setPreviewMode('desktop')} className={`px-3 py-1.5 text-xs font-medium ${previewMode === 'desktop' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}>Desktop</button>
            <button onClick={() => setPreviewMode('mobile')} className={`px-3 py-1.5 text-xs font-medium ${previewMode === 'mobile' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}>Mobile</button>
          </div>
          <button onClick={handleReset} className="btn-secondary"><FiRotateCcw className="w-4 h-4 mr-1" /> Reset</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary"><FiSave className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Theme'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Section title="Colors" icon={FiEye}>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(COLOR_PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
            <Input label="Primary Color" type="color" value={theme.colors.primary} onChange={(v) => updateTheme('colors', 'primary', v)} />
            <Input label="Secondary Color" type="color" value={theme.colors.secondary} onChange={(v) => updateTheme('colors', 'secondary', v)} />
            <Input label="Background Color" type="color" value={theme.colors.background} onChange={(v) => updateTheme('colors', 'background', v)} />
            <Input label="Text Color" type="color" value={theme.colors.text} onChange={(v) => updateTheme('colors', 'text', v)} />
          </Section>

          <Section title="Fonts" icon={FiType}>
            <Input label="Heading Font" type="select" value={theme.fonts.heading} onChange={(v) => updateTheme('fonts', 'heading', v)} options={FONT_OPTIONS} />
            <Input label="Body Font" type="select" value={theme.fonts.body} onChange={(v) => updateTheme('fonts', 'body', v)} options={FONT_OPTIONS} />
          </Section>

          <Section title="Layout" icon={FiLayout}>
            <Input label="Container Width (px)" type="number" value={theme.layout.containerWidth} onChange={(v) => updateTheme('layout', 'containerWidth', v)} min="960" max="1920" />
            <Input label="Sidebar Position" type="select" value={theme.layout.sidebarPosition} onChange={(v) => updateTheme('layout', 'sidebarPosition', v)} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
          </Section>

          <Section title="Header" icon={FiEye}>
            <Input label="Logo Position" type="select" value={theme.header.logoPosition} onChange={(v) => updateTheme('header', 'logoPosition', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }]} />
            <Input label="Menu Position" type="select" value={theme.header.menuPosition} onChange={(v) => updateTheme('header', 'menuPosition', v)} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'center', label: 'Center' }]} />
          </Section>

          <Section title="Footer" icon={FiGrid}>
            <Input label="Column Count" type="select" value={theme.footer.columnCount} onChange={(v) => updateTheme('footer', 'columnCount', parseInt(v))} options={[{ value: 2, label: '2 Columns' }, { value: 3, label: '3 Columns' }, { value: 4, label: '4 Columns' }]} />
          </Section>

          <Section title="Homepage Sections" icon={FiHome}>
            <div className="space-y-3">
              {[
                { key: 'showHero', label: 'Hero Banner' },
                { key: 'showFeatured', label: 'Featured Products' },
                { key: 'showCategories', label: 'Categories' },
                { key: 'showTrending', label: 'Trending Products' },
                { key: 'showNewsletter', label: 'Newsletter Signup' },
              ].map((section) => (
                <div key={section.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{section.label}</span>
                  <Input
                    label=""
                    type="toggle"
                    value={theme.homepage[section.key]}
                    onChange={(v) => updateTheme('homepage', section.key, v)}
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Custom CSS" icon={FiEye}>
            <textarea
              value={theme.customCss}
              onChange={(e) => setTheme((prev) => ({ ...prev, customCss: e.target.value }))}
              className="input-field font-mono text-sm"
              rows={8}
              placeholder="/* Add custom CSS here */"
            />
          </Section>
        </div>

        <div className="xl:col-span-3">
          <div className="sticky top-24">
            <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                <FiEye className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Live Preview</span>
              </div>
              <div className="p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
                <div className="border-b pb-4 mb-4" style={{ borderColor: theme.colors.text + '20' }}>
                  <div className="flex items-center justify-between" style={{ fontFamily: theme.fonts.heading }}>
                    <div className={`flex items-center gap-2 ${theme.header.logoPosition === 'center' ? 'mx-auto' : ''}`}>
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: theme.colors.primary }} />
                      <span className="font-bold text-lg" style={{ color: theme.colors.text }}>Store</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-sm" style={{ color: theme.colors.text + 'cc' }}>
                      <span>Home</span>
                      <span>Shop</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </div>
                </div>

                <div className="aspect-[2/1] rounded-xl mb-6 flex items-center justify-center" style={{ backgroundColor: theme.colors.primary + '15' }}>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}>Welcome to Our Store</h2>
                    <p className="text-sm" style={{ color: theme.colors.text + '99' }}>Discover amazing products at great prices</p>
                    <button className="mt-3 px-6 py-2 text-white text-sm font-medium rounded-lg" style={{ backgroundColor: theme.colors.primary }}>Shop Now</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square rounded-lg" style={{ backgroundColor: theme.colors.primary + '10' }} />
                  ))}
                </div>

                <div className="pt-4 border-t" style={{ borderColor: theme.colors.text + '15' }}>
                  <div className={`grid grid-cols-${theme.footer.columnCount} gap-4 text-xs`} style={{ color: theme.colors.text + '99' }}>
                    {Array.from({ length: theme.footer.columnCount }, (_, i) => (
                      <div key={i}>
                        <p className="font-semibold mb-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Column {i + 1}</p>
                        <p>Link 1</p>
                        <p>Link 2</p>
                        <p>Link 3</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
