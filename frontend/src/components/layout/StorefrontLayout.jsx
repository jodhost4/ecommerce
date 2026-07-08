import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiHeart, FiUser, FiMenu, FiX, FiChevronDown, FiLogOut, FiPackage, FiBell } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import authStore from '../../store/authStore';
import api from '../../services/api';
import { useParams } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';

export default function StorefrontLayout() {
  const { storeId: urlStoreId } = useParams();
  const [store, setStore] = useState(null);
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

  const [themeData, setThemeData] = useState({ pageLayouts: {}, store: null });

  useEffect(() => {
    if (urlStoreId) {
      api.get(`/stores/${urlStoreId}/home`).then(res => {
        const storeData = res.data.data.store;
        setStore(storeData);

        const pageLayouts = storeData.theme?.pageLayouts || {};
        setThemeData({ pageLayouts, store: storeData });

        // Apply theme colors if available (convert hex to RGB for CSS vars)
        if (storeData.theme?.colors) {
          const colors = storeData.theme.colors;
          const root = document.documentElement;
          const primaryRgb = hexToRgb(colors.primary);
          const secondaryRgb = hexToRgb(colors.secondary);
          const bgRgb = hexToRgb(colors.background);
          const textRgb = hexToRgb(colors.text);

          if (primaryRgb) {
            root.style.setProperty('--primary-50', `${primaryRgb}`);
            root.style.setProperty('--primary-100', `${primaryRgb}`);
            root.style.setProperty('--primary-200', `${primaryRgb}`);
            root.style.setProperty('--primary-300', `${primaryRgb}`);
            root.style.setProperty('--primary-400', `${primaryRgb}`);
            root.style.setProperty('--primary-500', `${primaryRgb}`);
            root.style.setProperty('--primary-600', `${primaryRgb}`);
            root.style.setProperty('--primary-700', `${primaryRgb}`);
            root.style.setProperty('--primary-800', `${primaryRgb}`);
            root.style.setProperty('--primary-900', `${primaryRgb}`);
            root.style.setProperty('--primary-950', `${primaryRgb}`);
          }
          if (secondaryRgb) {
            root.style.setProperty('--secondary-600', `${secondaryRgb}`);
            root.style.setProperty('--secondary-700', `${secondaryRgb}`);
          }
          if (textRgb) {
            root.style.setProperty('--secondary-900', `${textRgb}`);
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
    try { await api.post('/auth/logout'); } catch {}
    authStore.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to={`/store/${urlStoreId}/home`} className="flex items-center gap-2">
                {store?.logo ? (
                  <img src={store.logo} alt={store.name} className="h-8 w-auto object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-primary-600">{store?.name || 'Commerce'}</span>
                )}
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link to={`/store/${urlStoreId}/home`} className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">Home</Link>
                <Link to={`/store/${urlStoreId}/products`} className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">Shop</Link>
                <Link to={`/store/${urlStoreId}/categories`} className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">Categories</Link>
                <Link to={`/store/${urlStoreId}/about`} className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">About</Link>
                <Link to={`/store/${urlStoreId}/contact`} className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">Contact</Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FiSearch className="w-5 h-5" />
              </button>
              <Link to={`/store/${urlStoreId}/cart`} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FiShoppingCart className="w-5 h-5" />
              </Link>
              {isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-600">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <FiChevronDown className="w-4 h-4" />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <Link to={`/store/${urlStoreId}/profile`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><FiUser className="w-4 h-4 mr-2" /> My Profile</Link>
                        <Link to={`/store/${urlStoreId}/orders`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><FiPackage className="w-4 h-4 mr-2" /> Orders</Link>
                        <Link to={`/store/${urlStoreId}/wishlist`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><FiHeart className="w-4 h-4 mr-2" /> Wishlist</Link>
                        <Link to="/notifications" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><FiBell className="w-4 h-4 mr-2" /> Notifications</Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><FiLogOut className="w-4 h-4 mr-2" /> Logout</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="btn-primary text-sm">Sign In</Link>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-200 bg-white">
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
        <div className="md:hidden border-b border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-2">
            <Link to={`/store/${urlStoreId}/home`} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to={`/store/${urlStoreId}/products`} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link to={`/store/${urlStoreId}/about`} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to={`/store/${urlStoreId}/contact`} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            {isAuthenticated && (
              <>
                <Link to={`/store/${urlStoreId}/orders`} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link to={`/store/${urlStoreId}/profile`} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
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

      <footer className="bg-gray-900 text-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">{store?.name || 'Commerce'}</h3>
              <p className="text-sm leading-relaxed">{store?.description || 'Start selling online today.'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={`/store/${urlStoreId}/products`} className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to={`/store/${urlStoreId}/products?sort=popular`} className="hover:text-white transition-colors">Popular</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={`/store/${urlStoreId}/profile`} className="hover:text-white transition-colors">My Profile</Link></li>
                <li><Link to={`/store/${urlStoreId}/orders`} className="hover:text-white transition-colors">My Orders</Link></li>
                <li><Link to={`/store/${urlStoreId}/cart`} className="hover:text-white transition-colors">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={`/store/${urlStoreId}/contact`} className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to={`/store/${urlStoreId}/about`} className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to={`/store/${urlStoreId}/tracking`} className="hover:text-white transition-colors">Order Tracking</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
            <p>&copy; {new Date().getFullYear()} {store?.name || 'Commerce'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
