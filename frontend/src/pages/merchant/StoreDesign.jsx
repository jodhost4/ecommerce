import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiSave, FiRefreshCw, FiPlus, FiTrash2, FiEdit2, FiMove, FiEye, FiX,
  FiLayout, FiHome, FiMenu, FiChevronDown, FiChevronUp, FiLink, FiGrid,
  FiShoppingCart, FiHeart, FiFileText, FiExternalLink, FiCopy, FiCheck,
  FiClipboard
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { THEME_PRESETS } from '../../utils/constants';
import authStore from '../../store/authStore';

const designTabs = [
  { id: 'theme', label: 'Theme', icon: FiEye },
  { id: 'homepage', label: 'Homepage', icon: FiHome },
  { id: 'header', label: 'Header', icon: FiLayout },
  { id: 'footer', label: 'Footer', icon: FiLayout },
  { id: 'menus', label: 'Menus', icon: FiMenu },
  { id: 'pages', label: 'Pages', icon: FiFileText },
  { id: 'shop-layout', label: 'Shop', icon: FiGrid },
  { id: 'categories-layout', label: 'Categories', icon: FiGrid },
  { id: 'product-page', label: 'Product', icon: FiEye },
  { id: 'cart', label: 'Cart', icon: FiShoppingCart },
  { id: 'checkout', label: 'Checkout', icon: FiShoppingCart },
  { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
  { id: 'routes', label: 'Routes', icon: FiLink },
];

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
];

const SECTION_TYPES = [
  { id: 'hero', label: 'Hero Banner' },
  { id: 'featured-products', label: 'Featured Products' },
  { id: 'featured-categories', label: 'Featured Categories (Dynamic)' },
  { id: 'trending-products', label: 'Trending Products (Dynamic)' },
  { id: 'categories', label: 'Categories Grid' },
  { id: 'categories-list', label: 'Categories List' },
  { id: 'promo-banner', label: 'Promo Banner' },
  { id: 'offer-banner', label: 'Offer / Discount Banner' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'newsletter', label: 'Newsletter Signup' },
];

const defaultPageLayouts = {
  shop: { viewMode: 'grid', sidebar: true, itemsPerPage: 12, showFilters: true, showSort: true },
  'product-detail': { showReviews: true, showRelated: true, showVariants: true, galleryStyle: 'stacked' },
  cart: { showCoupon: true, showShipping: true, layout: 'default' },
  checkout: { showNotes: true, showCoupon: true, stepsStyle: 'sidebar' },
  wishlist: { viewMode: 'grid', showShare: true },
  categories: { viewMode: 'grid', sidebar: true, showProductCount: true },
};

function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-sm text-secondary-700">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary-600' : 'bg-secondary-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export default function StoreDesign() {
  const storeSlug = authStore.user?.ownedStore?.slug;
  const [activeTab, setActiveTab] = useState('theme');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedRoute, setCopiedRoute] = useState(null);

  const [theme, setTheme] = useState({
    selected: 'light',
    colors: { primary: '#3b82f6', secondary: '#10b981', background: '#ffffff', text: '#1e293b' },
    fonts: { heading: 'Inter', body: 'Inter' },
  });

  const [homepage, setHomepage] = useState({ sections: [] });
  const [header, setHeader] = useState({ logo: '', links: [{ label: 'Home', url: '/' }], contactEmail: '', contactPhone: '' });
  const [footer, setFooter] = useState({ logo: '', description: '', links: [{ label: 'About', url: '/about' }], socialLinks: [] });
  const [menus, setMenus] = useState({ items: [] });
  const [pages, setPages] = useState([]);
  const [pageLayouts, setPageLayouts] = useState(defaultPageLayouts);
  const [routes, setRoutes] = useState({ categories: [], products: [], cmsPages: [] });

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  useEffect(() => {
    fetchDesignData();
  }, []);

  const fetchDesignData = async () => {
    setLoading(true);
    try {
      const [themeRes, homeRes, headerRes, footerRes, menusRes, pagesRes, layoutsRes, catsRes, prodsRes] = await Promise.allSettled([
        api.get('/store-design/theme'),
        api.get('/store-design/homepage'),
        api.get('/store-design/header'),
        api.get('/store-design/footer'),
        api.get('/store-design/menus'),
        api.get('/cms-pages?limit=1000'),
        api.get('/store-design/page-layouts'),
        api.get('/categories?limit=1000'),
        api.get('/products?limit=1000'),
      ]);
      if (themeRes.value) setTheme(themeRes.value.data.data || theme);
      if (homeRes.value) {
        const data = homeRes.value.data.data;
        if (data) {
          setHomepage({ sections: data.sections || [], ...data });
        }
      }
      if (headerRes.value) {
        const data = headerRes.value.data.data;
        if (data) setHeader({ links: data.links || [], logo: data.logo || '', contactEmail: data.contactEmail || '', contactPhone: data.contactPhone || '' });
      }
      if (footerRes.value) {
        const data = footerRes.value.data.data;
        if (data) setFooter({ links: data.links || [], logo: data.logo || '', description: data.description || '', socialLinks: data.socialLinks || [] });
      }
      if (menusRes.value) {
        const data = menusRes.value.data.data;
        if (data) setMenus({ items: data.items || [] });
      }
      if (pagesRes.value) setPages(pagesRes.value.data.data || []);
      if (layoutsRes.value) {
        const data = layoutsRes.value.data.data;
        if (data) setPageLayouts({ ...defaultPageLayouts, ...data });
      }
      if (catsRes.value) setRoutes(prev => ({ ...prev, categories: catsRes.value.data.data || [] }));
      if (prodsRes.value) setRoutes(prev => ({ ...prev, products: prodsRes.value.data.data || [] }));
      if (pagesRes.value) setRoutes(prev => ({ ...prev, cmsPages: pagesRes.value.data.data || [] }));
    } catch {
      toast.error('Failed to load design data');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setTheme((prev) => ({
      ...prev,
      selected: preset.id,
      colors: { ...prev.colors, ...preset.colors },
    }));
  };

  const updateColor = (key, value) => {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateFont = (key, value) => {
    setTheme((prev) => ({ ...prev, fonts: { ...prev.fonts, [key]: value } }));
  };

  const addSection = () => {
    setEditingSection({
      type: SECTION_TYPES[0].id,
      title: '',
      content: '',
      imageUrl: '',
      link: '',
      buttonText: 'Shop Now',
      isActive: true,
      discountPercentage: '',
      couponCode: '',
      expiryDate: '',
    });
    setShowSectionModal(true);
  };

  const saveSection = () => {
    if (!editingSection.title) { toast.error('Section title is required'); return; }
    if (editingSection.id) {
      setHomepage((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => s.id === editingSection.id ? editingSection : s)
      }));
    } else {
      const newSection = { id: Date.now().toString(), ...editingSection };
      setHomepage((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
    }
    setShowSectionModal(false);
    setEditingSection(null);
    toast.success(editingSection.id ? 'Section updated' : 'Section added');
  };

  const editSection = (section) => {
    setEditingSection({ ...section });
    setShowSectionModal(true);
  };

  const removeSection = (id) => {
    setHomepage((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
    toast.success('Section removed');
  };

  const moveSection = (index, direction) => {
    const items = [...homepage.sections];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setHomepage((prev) => ({ ...prev, sections: items }));
  };

  const addHeaderLink = () => {
    setHeader((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }));
  };

  const updateHeaderLink = (index, field, value) => {
    const links = [...header.links];
    links[index] = { ...links[index], [field]: value };
    setHeader((prev) => ({ ...prev, links }));
  };

  const removeHeaderLink = (index) => {
    setHeader((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  const addFooterLink = () => {
    setFooter((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }));
  };

  const updateFooterLink = (index, field, value) => {
    const links = [...footer.links];
    links[index] = { ...links[index], [field]: value };
    setFooter((prev) => ({ ...prev, links }));
  };

  const removeFooterLink = (index) => {
    setFooter((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  const addMenuItem = () => {
    setMenus((prev) => ({ ...prev, items: [...prev.items, { label: '', url: '', children: [] }] }));
  };

  const updateMenuItem = (index, field, value) => {
    const items = [...menus.items];
    items[index] = { ...items[index], [field]: value };
    setMenus((prev) => ({ ...prev, items }));
  };

  const removeMenuItem = (index) => {
    setMenus((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updatePageLayout = async (pageType, key, value) => {
    const updated = { ...pageLayouts[pageType], [key]: value };
    const allLayouts = { ...pageLayouts, [pageType]: updated };
    setPageLayouts(allLayouts);
    try {
      await api.put(`/store-design/page-layouts/${pageType}`, updated);
    } catch {
      toast.error('Failed to save layout');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRoute(text);
      setTimeout(() => setCopiedRoute(null), 2000);
      toast.success('Route copied');
    }).catch(() => toast.error('Failed to copy'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoints = {
        theme: '/store-design/theme',
        homepage: '/store-design/homepage',
        header: '/store-design/header',
        footer: '/store-design/footer',
        menus: '/store-design/menus',
      };
      const payloads = { theme, homepage, header, footer, menus };
      if (endpoints[activeTab]) {
        await api.put(endpoints[activeTab], payloads[activeTab]);
      }
      toast.success('Saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const layoutTabs = ['shop-layout', 'product-page', 'cart', 'checkout', 'wishlist', 'categories'];

  const renderLayoutSection = (pageType, label, fields) => (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-secondary-900 mb-4 capitalize">{label} Layout</h2>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            {field.type === 'toggle' ? (
              <Toggle
                label={field.label}
                value={pageLayouts[pageType]?.[field.key] ?? field.default}
                onChange={(v) => updatePageLayout(pageType, field.key, v)}
              />
            ) : field.type === 'select' ? (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">{field.label}</label>
                <select
                  value={pageLayouts[pageType]?.[field.key] ?? field.default}
                  onChange={(e) => updatePageLayout(pageType, field.key, e.target.value)}
                  className="input-field w-full"
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : field.type === 'number' ? (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">{field.label}</label>
                <input
                  type="number"
                  value={pageLayouts[pageType]?.[field.key] ?? field.default}
                  onChange={(e) => updatePageLayout(pageType, field.key, parseInt(e.target.value))}
                  className="input-field"
                  min={field.min}
                  max={field.max}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  const allRoutes = [
    { type: 'Home', name: 'Home Page', route: `/store/${storeSlug || '{slug}'}/home` },
    { type: 'Shop', name: 'All Products', route: `/store/${storeSlug || '{slug}'}/products` },
    { type: 'Cart', name: 'Shopping Cart', route: `/store/${storeSlug || '{slug}'}/cart` },
    { type: 'Checkout', name: 'Checkout', route: `/store/${storeSlug || '{slug}'}/checkout` },
    { type: 'Wishlist', name: 'Wishlist', route: `/store/${storeSlug || '{slug}'}/wishlist` },
    { type: 'Categories', name: 'All Categories', route: `/store/${storeSlug || '{slug}'}/categories` },
    { type: 'Orders', name: 'My Orders', route: `/store/${storeSlug || '{slug}'}/orders` },
    { type: 'Profile', name: 'My Profile', route: `/store/${storeSlug || '{slug}'}/profile` },
    { type: 'Addresses', name: 'Address Book', route: `/store/${storeSlug || '{slug}'}/addresses` },
    { type: 'Tracking', name: 'Order Tracking', route: `/store/${storeSlug || '{slug}'}/tracking` },
    { type: 'About', name: 'About Us', route: `/store/${storeSlug || '{slug}'}/about` },
    { type: 'Contact', name: 'Contact Us', route: `/store/${storeSlug || '{slug}'}/contact` },
    { type: 'Footer', name: 'All Products (Footer)', route: `/store/${storeSlug || '{slug}'}/products` },
    { type: 'Footer', name: 'Popular Products (Footer)', route: `/store/${storeSlug || '{slug}'}/products?sort=popular` },
    { type: 'Footer', name: 'My Profile (Footer)', route: `/store/${storeSlug || '{slug}'}/profile` },
    { type: 'Footer', name: 'My Orders (Footer)', route: `/store/${storeSlug || '{slug}'}/orders` },
    { type: 'Footer', name: 'Cart (Footer)', route: `/store/${storeSlug || '{slug}'}/cart` },
    { type: 'Footer', name: 'Contact Us (Footer)', route: `/store/${storeSlug || '{slug}'}/contact` },
    { type: 'Footer', name: 'About Us (Footer)', route: `/store/${storeSlug || '{slug}'}/about` },
    { type: 'Footer', name: 'Order Tracking (Footer)', route: `/store/${storeSlug || '{slug}'}/tracking` },
    ...(footer.links || []).filter(l => l.label && l.url).map((l) => ({
      type: 'Footer Link',
      name: l.label,
      route: l.url.startsWith('http') ? l.url : `/store/${storeSlug || '{slug}'}${l.url}`,
    })),
    ...(header.links || []).filter(l => l.label && l.url).map((l) => ({
      type: 'Header Link',
      name: l.label,
      route: l.url.startsWith('http') ? l.url : `/store/${storeSlug || '{slug}'}${l.url}`,
    })),
    ...(routes.categories || []).map((cat) => ({
      type: 'Category',
      name: cat.name,
      route: `/store/${storeSlug || '{slug}'}/categories/${cat.slug}`,
    })),
    ...(routes.products || []).map((prod) => ({
      type: 'Product',
      name: prod.name,
      route: `/store/${storeSlug || '{slug}'}/products/${prod.slug}`,
    })),
    ...(routes.cmsPages || []).map((cms) => ({
      type: 'CMS Page',
      name: cms.title,
      route: `/store/${storeSlug || '{slug}'}/page/${cms.slug}`,
    })),
    ...(pages || []).map((p) => ({
      type: 'CMS Page',
      name: p.title,
      route: `/store/${storeSlug || '{slug}'}/page/${p.slug}`,
    })),
  ];

  const routeTypes = [...new Set(allRoutes.map((r) => r.type))];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Store Design</h1>
        <div className="flex items-center space-x-2">
          <button onClick={fetchDesignData} className="btn-secondary p-2 rounded-lg"><FiRefreshCw className="w-4 h-4" /></button>
          {activeTab !== 'routes' && (
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2 px-4 py-2 rounded-lg">
              <FiSave className="w-4 h-4" /><span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-1 bg-secondary-100 rounded-lg p-1 mb-6 w-fit overflow-x-auto">
        {designTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-600 hover:text-secondary-900'}`}
          >
            <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'theme' && (
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
                    <div className="flex items-center space-x-2">
                      <input type="color" value={theme.colors[key]} onChange={(e) => updateColor(key, e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-secondary-300" />
                      <input type="text" value={theme.colors[key]} onChange={(e) => updateColor(key, e.target.value)} className="input-field flex-1 font-mono text-sm" />
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
                  <select value={theme.fonts.heading} onChange={(e) => updateFont('heading', e.target.value)} className="input-field w-full">
                    {fontOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Body Font</label>
                  <select value={theme.fonts.body} onChange={(e) => updateFont('body', e.target.value)} className="input-field w-full">
                    {fontOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Theme Presets</h2>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset(preset)}
                    className={`p-3 rounded-lg border transition-colors text-left ${theme.selected === preset.id ? 'border-primary-500 ring-2 ring-primary-100' : 'border-secondary-200 hover:border-primary-300'}`}
                  >
                    <div className="flex space-x-1 mb-2">
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
              <div className="rounded-xl p-6 border" style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.text + '20' }}>
                <h3 className="text-xl font-bold mb-3" style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Store Preview</h3>
                <div className="flex space-x-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: theme.colors.primary }}>Shop Now</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: theme.colors.secondary }}>Sale</span>
                </div>
                <p className="text-sm mb-3" style={{ color: theme.colors.text + 'cc', fontFamily: theme.fonts.body }}>Your store design preview</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'homepage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Homepage Sections</h2>
            <button onClick={addSection} className="btn-primary flex items-center space-x-2 px-4 py-2">
              <FiPlus className="w-4 h-4" /><span>Add Section</span>
            </button>
          </div>
          {homepage.sections.length === 0 ? (
            <div className="card p-12 text-center">
              <FiLayout className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500">No sections yet. Add sections to build your homepage layout.</p>
            </div>
          ) : (
            homepage.sections.map((section, index) => (
              <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col space-y-1">
                      <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="p-0.5 text-secondary-400 hover:text-secondary-600 disabled:opacity-30"><FiChevronUp className="w-3 h-3" /></button>
                      <button onClick={() => moveSection(index, 1)} disabled={index === homepage.sections.length - 1} className="p-0.5 text-secondary-400 hover:text-secondary-600 disabled:opacity-30"><FiChevronDown className="w-3 h-3" /></button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{section.title}</p>
                      <p className="text-xs text-secondary-500">{SECTION_TYPES.find((t) => t.id === section.type)?.label || section.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${section.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {section.isActive !== false ? 'Active' : 'Hidden'}
                    </span>
                    <button onClick={() => editSection(section)} className="p-1.5 text-secondary-500 hover:bg-secondary-100 rounded-lg"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => removeSection(section.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'header' && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Logo URL</label>
            <div className="flex items-center space-x-3">
              <input type="text" value={header.logo} onChange={(e) => setHeader((p) => ({ ...p, logo: e.target.value }))} className="input-field flex-1" placeholder="https://example.com/logo.png" />
              {header.logo && <div className="w-10 h-10 rounded border border-secondary-200 overflow-hidden flex-shrink-0"><img src={header.logo} alt="" className="w-full h-full object-cover" /></div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Email</label>
              <input type="email" value={header.contactEmail} onChange={(e) => setHeader((p) => ({ ...p, contactEmail: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Contact Phone</label>
              <input type="text" value={header.contactPhone} onChange={(e) => setHeader((p) => ({ ...p, contactPhone: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary-700">Navigation Links</label>
              <button onClick={addHeaderLink} className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"><FiPlus className="w-3 h-3" /><span>Add Link</span></button>
            </div>
            <div className="space-y-2">
              {header.links.map((link, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input type="text" value={link.label} onChange={(e) => updateHeaderLink(i, 'label', e.target.value)} className="input-field flex-1" placeholder="Label" />
                  <input type="text" value={link.url} onChange={(e) => updateHeaderLink(i, 'url', e.target.value)} className="input-field flex-1" placeholder="/path" />
                  <button onClick={() => removeHeaderLink(i)} className="btn-danger p-2"><FiTrash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'footer' && (
        <div className="card p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Footer Logo URL</label>
            <input type="text" value={footer.logo} onChange={(e) => setFooter((p) => ({ ...p, logo: e.target.value }))} className="input-field" placeholder="https://example.com/logo.png" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <textarea value={footer.description} onChange={(e) => setFooter((p) => ({ ...p, description: e.target.value }))} rows={3} className="input-field" placeholder="About your store..." />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-secondary-700">Footer Links</label>
              <button onClick={addFooterLink} className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"><FiPlus className="w-3 h-3" /><span>Add Link</span></button>
            </div>
            <div className="space-y-2">
              {footer.links.map((link, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input type="text" value={link.label} onChange={(e) => updateFooterLink(i, 'label', e.target.value)} className="input-field flex-1" placeholder="Label" />
                  <input type="text" value={link.url} onChange={(e) => updateFooterLink(i, 'url', e.target.value)} className="input-field flex-1" placeholder="/path" />
                  <button onClick={() => removeFooterLink(i)} className="btn-danger p-2"><FiTrash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menus' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Menu Items</h2>
            <button onClick={addMenuItem} className="btn-primary flex items-center space-x-2 px-4 py-2">
              <FiPlus className="w-4 h-4" /><span>Add Item</span>
            </button>
          </div>
          {menus.items.length === 0 ? (
            <p className="text-secondary-500 text-center py-8">No menu items. Add items to build your navigation menu.</p>
          ) : (
            <div className="space-y-2">
              {menus.items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-2 p-3 bg-secondary-50 rounded-lg">
                  <FiMove className="w-4 h-4 text-secondary-400 cursor-move" />
                  <input type="text" value={item.label} onChange={(e) => updateMenuItem(i, 'label', e.target.value)} className="input-field flex-1" placeholder="Menu Label" />
                  <input type="text" value={item.url} onChange={(e) => updateMenuItem(i, 'url', e.target.value)} className="input-field flex-1" placeholder="/path" />
                  <button onClick={() => removeMenuItem(i)} className="btn-danger p-2"><FiTrash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Static Pages</h2>
          {pages.length === 0 ? (
            <p className="text-secondary-500 text-center py-8">No pages found</p>
          ) : (
            <div className="space-y-2">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 hover:bg-secondary-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <FiFileText className="w-4 h-4 text-secondary-400" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{p.title}</p>
                      <p className="text-xs text-secondary-500">/{p.slug}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${p.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {p.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories-layout' && renderLayoutSection('categories', 'Categories Page', [
        { key: 'viewMode', label: 'Default View', type: 'select', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
        { key: 'sidebar', label: 'Show Sidebar', type: 'toggle', default: true },
        { key: 'showProductCount', label: 'Show Product Count', type: 'toggle', default: true },
      ])}

      {activeTab === 'shop-layout' && renderLayoutSection('shop', 'Shop Page', [
        { key: 'viewMode', label: 'Default View', type: 'select', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
        { key: 'sidebar', label: 'Show Sidebar', type: 'toggle', default: true },
        { key: 'showFilters', label: 'Show Filters', type: 'toggle', default: true },
        { key: 'showSort', label: 'Show Sort Options', type: 'toggle', default: true },
        { key: 'itemsPerPage', label: 'Items Per Page', type: 'number', default: 12, min: 6, max: 48 },
      ])}

      {activeTab === 'product-page' && renderLayoutSection('product-detail', 'Product Detail Page', [
        { key: 'showReviews', label: 'Show Reviews Section', type: 'toggle', default: true },
        { key: 'showRelated', label: 'Show Related Products', type: 'toggle', default: true },
        { key: 'showVariants', label: 'Show Variant Options', type: 'toggle', default: true },
        { key: 'galleryStyle', label: 'Image Gallery Style', type: 'select', default: 'stacked', options: [{ value: 'stacked', label: 'Stacked' }, { value: 'carousel', label: 'Carousel' }] },
      ])}

      {activeTab === 'cart' && renderLayoutSection('cart', 'Cart Page', [
        { key: 'showCoupon', label: 'Show Coupon Field', type: 'toggle', default: true },
        { key: 'showShipping', label: 'Show Shipping Estimate', type: 'toggle', default: true },
        { key: 'layout', label: 'Layout Style', type: 'select', default: 'default', options: [{ value: 'default', label: 'Default' }, { value: 'compact', label: 'Compact' }] },
      ])}

      {activeTab === 'checkout' && renderLayoutSection('checkout', 'Checkout Page', [
        { key: 'showNotes', label: 'Show Order Notes', type: 'toggle', default: true },
        { key: 'showCoupon', label: 'Show Coupon Field', type: 'toggle', default: true },
        { key: 'stepsStyle', label: 'Steps Layout', type: 'select', default: 'sidebar', options: [{ value: 'sidebar', label: 'Sidebar Summary' }, { value: 'top', label: 'Top Stepper' }] },
      ])}

      {activeTab === 'wishlist' && renderLayoutSection('wishlist', 'Wishlist Page', [
        { key: 'viewMode', label: 'Default View', type: 'select', default: 'grid', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }] },
        { key: 'showShare', label: 'Show Share Button', type: 'toggle', default: true },
      ])}

      {activeTab === 'routes' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">All Store Routes</h2>
              <p className="text-sm text-secondary-500 mt-1">Every page route across your store, all in one place</p>
            </div>
            <span className="text-sm text-secondary-500">{allRoutes.length} routes</span>
          </div>
          {routeTypes.map((type) => {
            const typeRoutes = allRoutes.filter((r) => r.type === type);
            return (
              <div key={type} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-secondary-700 uppercase tracking-wider mb-2">{type}</h3>
                <div className="space-y-1">
                  {typeRoutes.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 hover:bg-secondary-50 rounded-lg transition-colors group">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-xs font-medium text-secondary-400 w-16 flex-shrink-0">{r.type}</span>
                        <span className="text-sm text-secondary-900 truncate">{r.name}</span>
                        <code className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-mono truncate max-w-xs">{r.route}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(r.route)}
                        className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        title="Copy route"
                      >
                        {copiedRoute === r.route ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showSectionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowSectionModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-secondary-900">{editingSection?.id ? 'Edit Section' : 'Add Section'}</h2>
                <button onClick={() => setShowSectionModal(false)} className="p-1 hover:bg-secondary-100 rounded"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Section Type</label>
                  <select value={editingSection?.type} onChange={(e) => setEditingSection((p) => ({ ...p, type: e.target.value }))} className="input-field w-full">
                    {SECTION_TYPES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Title</label>
                  <input type="text" value={editingSection?.title || ''} onChange={(e) => setEditingSection((p) => ({ ...p, title: e.target.value }))} className="input-field" placeholder="Section title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Content / Subtitle</label>
                  <textarea value={editingSection?.content || ''} onChange={(e) => setEditingSection((p) => ({ ...p, content: e.target.value }))} rows={3} className="input-field" placeholder="Section content..." />
                </div>
                {(editingSection?.type === 'hero' || editingSection?.type === 'promo-banner' || editingSection?.type === 'offer-banner' || editingSection?.type === 'testimonials') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Image URL</label>
                      <input type="text" value={editingSection?.imageUrl || ''} onChange={(e) => setEditingSection((p) => ({ ...p, imageUrl: e.target.value }))} className="input-field" placeholder="https://example.com/image.jpg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Button Text</label>
                        <input type="text" value={editingSection?.buttonText || ''} onChange={(e) => setEditingSection((p) => ({ ...p, buttonText: e.target.value }))} className="input-field" placeholder="Shop Now" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Button Link</label>
                        <input type="text" value={editingSection?.link || ''} onChange={(e) => setEditingSection((p) => ({ ...p, link: e.target.value }))} className="input-field" placeholder="/products" />
                      </div>
                    </div>
                  </>
                )}
                {editingSection?.type === 'offer-banner' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Discount %</label>
                      <input type="number" value={editingSection?.discountPercentage || ''} onChange={(e) => setEditingSection((p) => ({ ...p, discountPercentage: e.target.value }))} className="input-field" placeholder="30" min="0" max="100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Coupon Code</label>
                      <input type="text" value={editingSection?.couponCode || ''} onChange={(e) => setEditingSection((p) => ({ ...p, couponCode: e.target.value }))} className="input-field" placeholder="SAVE30" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Expiry Date</label>
                      <input type="date" value={editingSection?.expiryDate || ''} onChange={(e) => setEditingSection((p) => ({ ...p, expiryDate: e.target.value }))} className="input-field" />
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="sectionActive" checked={editingSection?.isActive !== false} onChange={(e) => setEditingSection((p) => ({ ...p, isActive: e.target.checked }))} className="rounded border-secondary-300" />
                  <label htmlFor="sectionActive" className="text-sm text-secondary-700">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowSectionModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={saveSection} className="btn-primary px-4 py-2">{editingSection?.id ? 'Update' : 'Add'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
