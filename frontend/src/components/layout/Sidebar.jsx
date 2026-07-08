import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiShoppingBag, FiBox, FiUsers, FiFileText, FiSettings,
  FiBarChart2, FiTag, FiTruck, FiPercent, FiBell, FiGrid, FiDollarSign,
  FiShield, FiLayers, FiImage, FiMessageSquare, FiStar, FiLifeBuoy,
  FiTrendingUp, FiCreditCard, FiAward, FiMenu, FiBookOpen,
} from 'react-icons/fi';

const adminMenuItems = [
  { path: '/admin', icon: FiHome, label: 'Dashboard' },
  { path: '/admin/analytics', icon: FiTrendingUp, label: 'Analytics' },
  { path: '/admin/stores', icon: FiShoppingBag, label: 'Stores' },
  { path: '/admin/merchants', icon: FiUsers, label: 'Merchants' },
  { path: '/admin/users', icon: FiUsers, label: 'Users' },
  { path: '/admin/subscriptions', icon: FiAward, label: 'Subscriptions' },
  { path: '/admin/plans', icon: FiLayers, label: 'Plans' },
  { path: '/admin/payments', icon: FiDollarSign, label: 'Payments' },
  { path: '/admin/support', icon: FiLifeBuoy, label: 'Support' },
  { path: '/admin/roles', icon: FiShield, label: 'Roles & Permissions' },
  { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
];

const merchantMenuItems = [
  { path: '/merchant', icon: FiHome, label: 'Dashboard' },
  { path: '/merchant/products', icon: FiBox, label: 'Products' },
  { path: '/merchant/categories', icon: FiTag, label: 'Categories' },
  { path: '/merchant/brands', icon: FiAward, label: 'Brands' },
  { path: '/merchant/inventory', icon: FiGrid, label: 'Inventory' },
  { path: '/merchant/orders', icon: FiFileText, label: 'Orders' },
  { path: '/merchant/customers', icon: FiUsers, label: 'Customers' },
  { path: '/merchant/marketing', icon: FiPercent, label: 'Marketing' },
  { path: '/merchant/shipping', icon: FiTruck, label: 'Shipping' },
  { path: '/merchant/payments', icon: FiCreditCard, label: 'Payments' },
  { path: '/merchant/reports', icon: FiBarChart2, label: 'Reports' },
  { path: '/merchant/reviews', icon: FiStar, label: 'Reviews' },
  { path: '/merchant/theme', icon: FiImage, label: 'Theme' },
  { path: '/merchant/design', icon: FiMenu, label: 'Store Design' },
  { path: '/merchant/cms', icon: FiBookOpen, label: 'CMS Pages' },
  { path: '/merchant/settings', icon: FiSettings, label: 'Settings' },
];

export default function Sidebar({ open, onToggle }) {
  const role = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}')?.role?.name : null;
  const isAdmin = role === 'SUPER_ADMIN';
  const items = isAdmin ? adminMenuItems : merchantMenuItems;

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={{ width: open ? 256 : 0 }}
        animate={{ width: open ? 256 : 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-secondary-200 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
          <h1 className="text-xl font-bold text-primary-600">Commerce</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/merchant'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </motion.aside>
    </AnimatePresence>
  );
}
