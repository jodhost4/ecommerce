const Joi = require('joi');

const createStoreSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Store name must be at least 2 characters',
    'string.max': 'Store name must not exceed 100 characters',
    'any.required': 'Store name is required',
  }),
  description: Joi.string().max(2000).optional().allow(''),
  businessCategory: Joi.string().max(100).optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().max(500).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  state: Joi.string().max(100).optional().allow(''),
  country: Joi.string().max(100).optional().allow(''),
  zipCode: Joi.string().max(20).optional().allow(''),
  logo: Joi.string().uri().optional().allow(''),
  banner: Joi.string().uri().optional().allow(''),
  currency: Joi.string().length(3).optional().default('USD'),
  language: Joi.string().length(2).optional().default('en'),
  timezone: Joi.string().optional().default('UTC'),
  taxRate: Joi.number().min(0).max(100).optional(),
  shippingOrigin: Joi.string().max(500).optional().allow(''),
});

const updateStoreSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(2000).optional().allow(''),
  businessCategory: Joi.string().max(100).optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().max(500).optional().allow(''),
  city: Joi.string().max(100).optional().allow(''),
  state: Joi.string().max(100).optional().allow(''),
  country: Joi.string().max(100).optional().allow(''),
  zipCode: Joi.string().max(20).optional().allow(''),
  logo: Joi.string().uri().optional().allow(''),
  banner: Joi.string().uri().optional().allow(''),
});

const updateSettingsSchema = Joi.object({
  currency: Joi.string().length(3).optional(),
  language: Joi.string().length(2).optional(),
  timezone: Joi.string().optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  taxIncluded: Joi.boolean().optional(),
  shippingOrigin: Joi.string().max(500).optional().allow(''),
  defaultWeightUnit: Joi.string().valid('kg', 'lb', 'g', 'oz').optional(),
  orderPrefix: Joi.string().max(10).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  autoConfirmOrder: Joi.boolean().optional(),
  requireApproval: Joi.boolean().optional(),
  enableReviews: Joi.boolean().optional(),
  enableWishlist: Joi.boolean().optional(),
  enableCoupons: Joi.boolean().optional(),
});

const updateThemeSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  colors: Joi.object({
    primary: Joi.string().optional(),
    secondary: Joi.string().optional(),
    background: Joi.string().optional(),
    text: Joi.string().optional(),
  }).optional(),
  fonts: Joi.object({
    heading: Joi.string().optional(),
    body: Joi.string().optional(),
  }).optional(),
  layout: Joi.object({
    style: Joi.string().optional(),
    sidebar: Joi.boolean().optional(),
    homepage: Joi.string().optional(),
  }).optional(),
  header: Joi.object().optional(),
  footer: Joi.object().optional(),
  homepage: Joi.object().optional(),
  customCSS: Joi.string().optional().allow(''),
  isActive: Joi.boolean().optional(),
});

module.exports = {
  createStoreSchema,
  updateStoreSchema,
  updateSettingsSchema,
  updateThemeSchema,
};
