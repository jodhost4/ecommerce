import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PublicLayout from './components/layout/PublicLayout';
import MainLayout from './components/layout/MainLayout';
import StorefrontLayout from './components/layout/StorefrontLayout';
import LandingLayout from './components/layout/LandingLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import LandingHome from './pages/landing/LandingHome';
import Pricing from './pages/landing/Pricing';
import Templates from './pages/landing/Templates';
import Contact from './pages/landing/Contact';
import About from './pages/landing/About';
import FAQ from './pages/landing/FAQ';
import Blog from './pages/landing/Blog';
import Privacy from './pages/landing/Privacy';
import Terms from './pages/landing/Terms';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAnalytics from './pages/admin/Analytics';
import AdminStores from './pages/admin/Stores';
import AdminUsers from './pages/admin/Users';
import AdminMerchants from './pages/admin/Merchants';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminPlans from './pages/admin/Plans';
import AdminPayments from './pages/admin/PaymentsManagement';
import AdminSupport from './pages/admin/Support';
import AdminSettings from './pages/admin/Settings';
import AdminRolesPermissions from './pages/admin/RolesPermissions';
import MerchantDashboard from './pages/merchant/Dashboard';
import MerchantOrders from './pages/merchant/Orders';
import MerchantOrderDetail from './pages/merchant/OrderDetail';
import Products from './pages/merchant/Products';
import ProductForm from './pages/merchant/ProductForm';
import MerchantProductDetail from './pages/merchant/ProductDetail';
import Categories from './pages/merchant/Categories';
import Brands from './pages/merchant/Brands';
import Marketing from './pages/merchant/Marketing';
import ThemeCustomizer from './pages/merchant/ThemeCustomizer';
import StoreTheme from './pages/merchant/StoreTheme';
import StoreDesign from './pages/merchant/StoreDesign';
import StoreSetup from './pages/merchant/StoreSetup';
import Inventory from './pages/merchant/Inventory';
import Customers from './pages/merchant/Customers';
import CustomerDetail from './pages/merchant/CustomerDetail';
import Payments from './pages/merchant/Payments';
import Shipping from './pages/merchant/Shipping';
import Coupons from './pages/merchant/Coupons';
import SalesReport from './pages/merchant/SalesReport';
import RevenueReport from './pages/merchant/RevenueReport';
import ProductReport from './pages/merchant/ProductReport';
import Reports from './pages/merchant/Reports';
import StoreSettings from './pages/merchant/StoreSettings';
import CMS from './pages/merchant/CMS';
import Reviews from './pages/merchant/Reviews';
import Notifications from './pages/Notifications';
import Home from './pages/storefront/Home';
import AboutStore from './pages/storefront/About';
import ContactStore from './pages/storefront/Contact';
import CMSPage from './pages/storefront/CMSPage';
import StorefrontCategories from './pages/storefront/Categories';
import Shop from './pages/storefront/ProductListing';
import ProductListing from './pages/storefront/ProductListing';
import StorefrontProductDetail from './pages/storefront/ProductDetail';
import Cart from './pages/storefront/Cart';
import Checkout from './pages/storefront/Checkout';
import StorefrontOrders from './pages/storefront/Orders';
import StorefrontOrderDetail from './pages/storefront/OrderDetail';
import Profile from './pages/storefront/Profile';
import AddressBook from './pages/storefront/AddressBook';
import OrderTracking from './pages/storefront/OrderTracking';
import Wishlist from './pages/storefront/Wishlist';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingHome />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        <Route element={<StorefrontLayout />}>
          <Route path="/store/:storeId/home" element={<Home />} />
          <Route path="/store/:storeId/about" element={<AboutStore />} />
          <Route path="/store/:storeId/contact" element={<ContactStore />} />
          <Route path="/store/:storeId/page/:slug" element={<CMSPage />} />
          <Route path="/store/:storeId/shop" element={<Shop />} />
          <Route path="/store/:storeId/products" element={<ProductListing />} />
          <Route path="/store/:storeId/products/:slug" element={<StorefrontProductDetail />} />
          <Route path="/store/:storeId/categories" element={<StorefrontCategories />} />
          <Route path="/store/:storeId/categories/:slug" element={<ProductListing />} />
          <Route path="/store/:storeId/cart" element={<Cart />} />
          <Route path="/store/:storeId/checkout" element={<Checkout />} />
          <Route path="/store/:storeId/orders" element={<StorefrontOrders />} />
          <Route path="/store/:storeId/orders/:orderNumber" element={<StorefrontOrderDetail />} />
          <Route path="/store/:storeId/profile" element={<Profile />} />
          <Route path="/store/:storeId/addresses" element={<AddressBook />} />
          <Route path="/store/:storeId/tracking" element={<OrderTracking />} />
          <Route path="/store/:storeId/wishlist" element={<Wishlist />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="merchants" element={<AdminMerchants />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="roles" element={<AdminRolesPermissions />} />
        </Route>

        <Route
          path="/merchant"
          element={
            <ProtectedRoute roles={['STORE_OWNER', 'STORE_STAFF']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MerchantDashboard />} />
          <Route path="orders" element={<MerchantOrders />} />
          <Route path="orders/:id" element={<MerchantOrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<MerchantProductDetail />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/sales" element={<SalesReport />} />
          <Route path="reports/revenue" element={<RevenueReport />} />
          <Route path="reports/products" element={<ProductReport />} />
          <Route path="theme" element={<ThemeCustomizer />} />
          <Route path="theme/select" element={<StoreTheme />} />
          <Route path="design" element={<StoreDesign />} />
          <Route path="cms" element={<CMS />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="setup" element={<StoreSetup />} />
          <Route path="settings" element={<StoreSettings />} />
        </Route>

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <StorefrontLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
