export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_OWNER: 'STORE_OWNER',
  STORE_STAFF: 'STORE_STAFF',
  CUSTOMER: 'CUSTOMER',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
};

export const SHIPPING_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
};

export const COUPON_TYPE = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
  FREE_SHIPPING: 'FREE_SHIPPING',
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'hi', name: 'Hindi' },
];

export const STORE_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Home & Garden',
  'Beauty & Health',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Media',
  'Food & Beverages',
  'Automotive',
  'Other',
];

export const THEME_PRESETS = [
  {
    id: 'light',
    name: 'Light',
    colors: { primary: '#3b82f6', secondary: '#10b981', background: '#ffffff', text: '#1e293b' },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: { primary: '#60a5fa', secondary: '#f472b6', background: '#0f172a', text: '#f1f5f9' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    colors: { primary: '#000000', secondary: '#6b7280', background: '#ffffff', text: '#000000' },
  },
  {
    id: 'nature',
    name: 'Nature',
    colors: { primary: '#16a34a', secondary: '#d97706', background: '#f0fdf4', text: '#166534' },
  },
  {
    id: 'green',
    name: 'Green',
    colors: { primary: '#22c55e', secondary: '#16a34a', background: '#f0fdf4', text: '#14532d' },
  },
  {
    id: 'dark-green',
    name: 'Dark Green',
    colors: { primary: '#166534', secondary: '#15803d', background: '#052e16', text: '#bbf7d0' },
  },
  {
    id: 'black',
    name: 'Black',
    colors: { primary: '#ffffff', secondary: '#a3a3a3', background: '#000000', text: '#fafafa' },
  },
];
