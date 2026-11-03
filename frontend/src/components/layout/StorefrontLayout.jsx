import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiChevronDown, FiLogOut, FiPackage, FiBell, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import authStore from '../../store/authStore';
import api from '../../services/api';
import { ThemeContext } from './ThemeContext';

export default function StorefrontLayout() {
  const { storeId: urlStoreId } = useParams();
  const [store, setStore] = useState(null);
  const [storeTheme, setStoreTheme] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
  }

  const [themeData, setThemeData] = useState({ pageLayouts: {}, colors: {}, fonts: {}, footer: {}, storeSlug: null, store: null, paymentMethods: ['cod'] });

  useEffect(() => {
    if (urlStoreId) {
      api.get(`/stores/${urlStoreId}/home`).then(res => {
        const storeData = res.data.data.store;
        setStore(storeData);

        let activeTheme = storeData.theme || {};
        if (window.location.search.includes('preview=true')) {
          try {
            const previewData = JSON.parse(localStorage.getItem('theme_preview'));
            if (previewData) {
              activeTheme = { ...activeTheme, ...previewData };
            }
          } catch (e) {
            console.error('Failed to parse preview theme', e);
          }
        }

        setStoreTheme(activeTheme);

        const pageLayouts = activeTheme.pageLayouts || {};
        const themeColors = activeTheme.colors || {};
        const themeFonts = activeTheme.fonts || {};
        const themeFooter = activeTheme.footer || {};
        const paymentMethods = pageLayouts.checkout?.paymentMethods || ['cod'];

        setThemeData({
          pageLayouts,
          colors: themeColors,
          fonts: themeFonts,
          footer: themeFooter,
          storeSlug: storeData.slug,
          store: storeData,
          paymentMethods,
        });

        const theme = activeTheme;
        if (theme?.colors || theme?.fonts) {
          const root = document.documentElement;
          const colors = theme.colors || {};

          function hexToRgbObj(hex) {
            if (!hex) return null;
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          }

          function mix(c1, c2, weight) {
            const r = Math.round(c1.r * weight + c2.r * (1 - weight));
            const g = Math.round(c1.g * weight + c2.g * (1 - weight));
            const b = Math.round(c1.b * weight + c2.b * (1 - weight));
            return `${r} ${g} ${b}`;
          }

          const pri = hexToRgbObj(colors.primary);
          if (pri) {
            const weights = {
              50: { mix: { r: 255, g: 255, b: 255 }, w: 0.05 },
              100: { mix: { r: 255, g: 255, b: 255 }, w: 0.1 },
              200: { mix: { r: 255, g: 255, b: 255 }, w: 0.2 },
              300: { mix: { r: 255, g: 255, b: 255 }, w: 0.4 },
              400: { mix: { r: 255, g: 255, b: 255 }, w: 0.7 },
              500: { mix: { r: 255, g: 255, b: 255 }, w: 1.0 },
              600: { mix: { r: 0, g: 0, b: 0 }, w: 0.9 },
              700: { mix: { r: 0, g: 0, b: 0 }, w: 0.75 },
              800: { mix: { r: 0, g: 0, b: 0 }, w: 0.6 },
              900: { mix: { r: 0, g: 0, b: 0 }, w: 0.45 },
              950: { mix: { r: 0, g: 0, b: 0 }, w: 0.3 }
            };
            Object.entries(weights).forEach(([key, cfg]) => {
              root.style.setProperty(`--primary-${key}`, mix(pri, cfg.mix, cfg.w));
            });
          }

          const sec = hexToRgbObj(colors.secondary);
          if (sec) {
            const weights = {
              50: { mix: { r: 255, g: 255, b: 255 }, w: 0.05 },
              100: { mix: { r: 255, g: 255, b: 255 }, w: 0.1 },
              200: { mix: { r: 255, g: 255, b: 255 }, w: 0.2 },
              300: { mix: { r: 255, g: 255, b: 255 }, w: 0.4 },
              400: { mix: { r: 255, g: 255, b: 255 }, w: 0.7 },
              500: { mix: { r: 255, g: 255, b: 255 }, w: 1.0 },
              600: { mix: { r: 0, g: 0, b: 0 }, w: 0.9 },
              700: { mix: { r: 0, g: 0, b: 0 }, w: 0.75 },
              800: { mix: { r: 0, g: 0, b: 0 }, w: 0.6 },
              900: { mix: { r: 0, g: 0, b: 0 }, w: 0.45 },
              950: { mix: { r: 0, g: 0, b: 0 }, w: 0.3 }
            };
            Object.entries(weights).forEach(([key, cfg]) => {
              root.style.setProperty(`--secondary-${key}`, mix(sec, cfg.mix, cfg.w));
            });
          }

          const bgObj = hexToRgbObj(colors.background) || { r: 255, g: 255, b: 255 };
          const textObj = hexToRgbObj(colors.text) || { r: 30, g: 41, b: 59 };
          const isDark = (bgObj.r * 299 + bgObj.g * 587 + bgObj.b * 114) / 1000 < 128;

          const themeBgVal = `${bgObj.r} ${bgObj.g} ${bgObj.b}`;
          const themeTextVal = `${textObj.r} ${textObj.g} ${textObj.b}`;

          let cardBgObj, textMutedObj;
          if (isDark) {
            cardBgObj = {
              r: Math.min(255, bgObj.r + 15),
              g: Math.min(255, bgObj.g + 15),
              b: Math.min(255, bgObj.b + 15)
            };
            textMutedObj = {
              r: Math.round(textObj.r * 0.7 + bgObj.r * 0.3),
              g: Math.round(textObj.g * 0.7 + bgObj.g * 0.3),
              b: Math.round(textObj.b * 0.7 + bgObj.b * 0.3)
            };
          } else {
            cardBgObj = { r: 255, g: 255, b: 255 };
            textMutedObj = {
              r: Math.round(textObj.r * 0.6 + bgObj.r * 0.4),
              g: Math.round(textObj.g * 0.6 + bgObj.g * 0.4),
              b: Math.round(textObj.b * 0.6 + bgObj.b * 0.4)
            };
          }

          const themeCardBgVal = `${cardBgObj.r} ${cardBgObj.g} ${cardBgObj.b}`;
          const themeTextMutedVal = `${textMutedObj.r} ${textMutedObj.g} ${textMutedObj.b}`;
          const themeBorderVal = isDark
            ? `${Math.min(255, bgObj.r + 30)} ${Math.min(255, bgObj.g + 30)} ${Math.min(255, bgObj.b + 30)}`
            : `${Math.max(0, bgObj.r - 20)} ${Math.max(0, bgObj.g - 20)} ${Math.max(0, bgObj.b - 20)}`;

          root.style.setProperty('--theme-bg', themeBgVal);
          root.style.setProperty('--theme-text', themeTextVal);
          root.style.setProperty('--theme-card-bg', themeCardBgVal);
          root.style.setProperty('--theme-text-muted', themeTextMutedVal);
          root.style.setProperty('--theme-border-color', themeBorderVal);

          if (theme.fonts?.heading) {
            root.style.setProperty('--font-heading', `"${theme.fonts.heading}", sans-serif`);
          }
          if (theme.fonts?.body) {
            root.style.setProperty('--font-body', `"${theme.fonts.body}", sans-serif`);
          }
        }
      }).catch(err => console.error('Store fetch error:', err));
    }
  }, [urlStoreId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store/${urlStoreId}/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { }
    authStore.logout();
    navigate('/login');
  };

  const theme = storeTheme || {};
  const colors = theme.colors || {};
  const footerConfig = theme.footer || {};
  const footerColumns = footerConfig.links && footerConfig.links.length > 0
    ? footerConfig.links
    : [];

  const footerBgColor = colors.background || '#111827';
  const footerTextColor = colors.text ? `${colors.text}cc` : '#d1d5db';
  const footerHeadingColor = colors.text || '#ffffff';

  const headerLinks = (theme.header?.links && theme.header.links.length > 0)
    ? theme.header.links
    : [
      { label: 'Home', url: `/store/${urlStoreId}/home` },
      { label: 'Shop', url: `/store/${urlStoreId}/products` },
      { label: 'Categories', url: `/store/${urlStoreId}/categories` },
      { label: 'About', url: `/store/${urlStoreId}/about` },
      { label: 'Contact', url: `/store/${urlStoreId}/contact` },
    ];

  const isDarkBg = (bg) => {
    if (!bg) return false;
    const rgb = bg.replace('#', '');
    const r = parseInt(rgb.substring(0, 2), 16);
    const g = parseInt(rgb.substring(2, 4), 16);
    const b = parseInt(rgb.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const darkFooter = isDarkBg(footerBgColor);

  return (
    <div className="storefront-container min-h-screen" style={{
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      backgroundColor: colors.background || '#ffffff',
      color: colors.text || '#1e293b',
    }}>
      <header className="sticky top-0 z-50 border-b" style={{
        backgroundColor: colors.background || '#ffffff',
        borderColor: (colors.text || '#e5e7eb') + '20',
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to={`/store/${urlStoreId}/home`} className="flex items-center gap-2">
                {store?.logo ? (
                  <img src={store.logo} alt={store.name} className="h-8 w-auto object-contain" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: colors.primary || '#6366f1', fontFamily: 'var(--font-heading, Inter, sans-serif)' }}>
                    {store?.name || 'Commerce'}
                  </span>
                )}
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                {headerLinks.map((link, i) => {
                  // Resolve URL: if it already starts with 'http' or already is a full store path, use as-is
                  let to;
                  if (link.url.startsWith('http')) {
                    to = link.url;
                  } else if (link.url.startsWith(`/store/${urlStoreId}`)) {
                    to = link.url;
                  } else {
                    const slash = link.url.startsWith('/') ? '' : '/';
                    to = `/store/${urlStoreId}${slash}${link.url}`;
                  }
                  return (
                    <Link
                      key={i}
                      to={to}
                      className="text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: colors.text || '#374151' }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: colors.text || '#4b5563' }}>
                <FiSearch className="w-5 h-5" />
              </button>
              <Link to={`/store/${urlStoreId}/cart`} className="relative p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: colors.text || '#4b5563' }}>
                <FiShoppingCart className="w-5 h-5" />
              </Link>
              {isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: colors.text || '#4b5563' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: (colors.primary || '#6366f1') + '20' }}>
                      <span className="text-xs font-medium" style={{ color: colors.primary || '#6366f1' }}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <FiChevronDown className="w-4 h-4" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-20 py-1" style={{ backgroundColor: colors.background || '#ffffff', borderColor: (colors.text || '#e5e7eb') + '20' }}>
                        <div className="px-4 py-3 border-b" style={{ borderColor: (colors.text || '#e5e7eb') + '20' }}>
                          <p className="text-sm font-medium" style={{ color: colors.text || '#111827' }}>{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs" style={{ color: (colors.text || '#6b7280') + 'cc' }}>{user?.email}</p>
                        </div>
                        <Link to={`/store/${urlStoreId}/profile`} className="flex items-center px-4 py-2 text-sm hover:opacity-80" style={{ color: colors.text || '#374151' }}><FiUser className="w-4 h-4 mr-2" /> My Profile</Link>
                        <Link to={`/store/${urlStoreId}/orders`} className="flex items-center px-4 py-2 text-sm hover:opacity-80" style={{ color: colors.text || '#374151' }}><FiPackage className="w-4 h-4 mr-2" /> Orders</Link>
                        <Link to={`/store/${urlStoreId}/wishlist`} className="flex items-center px-4 py-2 text-sm hover:opacity-80" style={{ color: colors.text || '#374151' }}><FiHeart className="w-4 h-4 mr-2" /> Wishlist</Link>
                        <Link to="/notifications" className="flex items-center px-4 py-2 text-sm hover:opacity-80" style={{ color: colors.text || '#374151' }}><FiBell className="w-4 h-4 mr-2" /> Notifications</Link>
                        <hr className="my-1" style={{ borderColor: (colors.text || '#e5e7eb') + '20' }} />
                        <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><FiLogOut className="w-4 h-4 mr-2" /> Logout</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style={{ backgroundColor: colors.primary || '#6366f1' }}>Sign In</Link>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: colors.text || '#4b5563' }}>
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t" style={{ borderColor: (colors.text || '#e5e7eb') + '20', backgroundColor: colors.background || '#ffffff' }}>
            <div className="max-w-7xl mx-auto px-4 py-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-field flex-1"
                  autoFocus
                />
                <button type="submit" className="btn-primary"><FiSearch className="w-4 h-4" /></button>
              </form>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden border-b" style={{ borderColor: (colors.text || '#e5e7eb') + '20', backgroundColor: colors.background || '#ffffff' }}>
          <nav className="px-4 py-3 space-y-2">
            {headerLinks.map((link, i) => {
              let to;
              if (link.url.startsWith('http')) {
                to = link.url;
              } else if (link.url.startsWith(`/store/${urlStoreId}`)) {
                to = link.url;
              } else {
                const slash = link.url.startsWith('/') ? '' : '/';
                to = `/store/${urlStoreId}${slash}${link.url}`;
              }
              return (
                <Link
                  key={i}
                  to={to}
                  className="block px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80"
                  style={{ color: colors.text || '#374151' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <>
                <Link to={`/store/${urlStoreId}/orders`} className="block px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80" style={{ color: colors.text || '#374151' }} onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link to={`/store/${urlStoreId}/profile`} className="block px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80" style={{ color: colors.text || '#374151' }} onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              </>
            )}
          </nav>
        </div>
      )}

      <main>
        <ThemeContext.Provider value={themeData}>
          <Outlet />
        </ThemeContext.Provider>
      </main>

      <footer className="mt-16" style={{ backgroundColor: footerBgColor }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4" style={{
                color: footerHeadingColor,
                fontFamily: 'var(--font-heading, Inter, sans-serif)',
              }}>
                {store?.name || 'Commerce'}
              </h3>
              {footerConfig.logo && (
                <img src={footerConfig.logo} alt="" className="h-8 mb-3 object-contain inline-block" />
              )}
              <p className="text-sm leading-relaxed mt-2" style={{ color: footerTextColor }}>
                {footerConfig.description || store?.description || 'Start selling online today.'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: footerHeadingColor }}>Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {(footerConfig.links && footerConfig.links.length > 0 ? footerConfig.links : [
                  { label: 'All Products', url: `/store/${urlStoreId}/products` },
                  { label: 'Categories', url: `/store/${urlStoreId}/categories` },
                ]).map((link, j) => {
                  if (!link.label) return null;
                  let to = link.url;
                  if (!to?.startsWith('http') && !to?.startsWith(`/store/${urlStoreId}`)) {
                    const slash = to?.startsWith('/') ? '' : '/';
                    to = `/store/${urlStoreId}${slash}${to || ''}`;
                  }
                  return (
                    <li key={j}>
                      {to.startsWith('http') ? (
                        <a href={to} target="_blank" rel="noopener noreferrer" className="transition-colors hover:opacity-80" style={{ color: footerTextColor }}>{link.label}</a>
                      ) : (
                        <Link to={to} className="transition-colors hover:opacity-80" style={{ color: footerTextColor }}>{link.label}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: footerHeadingColor }}>Customer Service</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={`/store/${urlStoreId}/profile`} className="hover:opacity-80 transition-colors" style={{ color: footerTextColor }}>My Profile</Link></li>
                <li><Link to={`/store/${urlStoreId}/orders`} className="hover:opacity-80 transition-colors" style={{ color: footerTextColor }}>Order History</Link></li>
                <li><Link to={`/store/${urlStoreId}/tracking`} className="hover:opacity-80 transition-colors" style={{ color: footerTextColor }}>Track Order</Link></li>
                <li><Link to={`/store/${urlStoreId}/contact`} className="hover:opacity-80 transition-colors" style={{ color: footerTextColor }}>Contact Us</Link></li>
              </ul>
            </div>
          </div>
          {footerConfig.socialLinks && footerConfig.socialLinks.length > 0 && (
            <div className="flex justify-center gap-4 mt-8">
              {footerConfig.socialLinks.map((sl, i) => (
                <a key={i} href={sl.url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: (colors.primary || '#6366f1') + '20', color: colors.primary || '#6366f1' }}>
                  {sl.icon ? <span className="text-sm">{sl.icon}</span> : <FiMail className="w-4 h-4" />}
                </a>
              ))}
            </div>
          )}
          <div className="mt-8 pt-8 border-t text-sm text-center" style={{ borderColor: (footerTextColor || '#374151') + '20', color: footerTextColor }}>
            <p>&copy; {new Date().getFullYear()} {store?.name || 'Commerce'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
