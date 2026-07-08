const Joi = require('joi');

const imageSchema = Joi.object({
  url: Joi.string().required(),
  altText: Joi.string().max(255).optional(),
  isPrimary: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});

const variantSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().optional().allow(null, ''),
  barcode: Joi.string().optional().allow(null, ''),
  price: Joi.number().min(0).required(),
  comparePrice: Joi.number().min(0).optional().allow(null, ''),
  costPrice: Joi.number().min(0).optional().allow(null, ''),
  weight: Joi.number().min(0).optional().allow(null, ''),
  options: Joi.object().optional(),
  stock: Joi.number().integer().min(0).optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});

const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional().allow(''),
  shortDescription: Joi.string().max(500).optional().allow(''),
  basePrice: Joi.number().min(0).required(),
  comparePrice: Joi.number().min(0).optional().allow(null, ''),
  costPrice: Joi.number().min(0).optional().allow(null, ''),
  categoryId: Joi.string().uuid().optional().allow(null, ''),
  brandId: Joi.string().uuid().optional().allow(null, ''),
  tags: Joi.array().items(Joi.string()).optional(),
  sku: Joi.string().optional().allow(null, ''),
  barcode: Joi.string().optional().allow(null, ''),
  weight: Joi.number().min(0).optional().allow(null, ''),
  weightUnit: Joi.string().valid('kg', 'g', 'lb', 'oz').optional(),
  trackQuantity: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  isPhysical: Joi.boolean().optional(),
  images: Joi.array().items(imageSchema).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  metaTitle: Joi.string().max(70).optional().allow(''),
  metaDescription: Joi.string().max(160).optional().allow(''),
  metaKeywords: Joi.string().max(255).optional().allow(''),
  stock: Joi.number().integer().min(0).optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().optional().allow(''),
  shortDescription: Joi.string().max(500).optional().allow(''),
  basePrice: Joi.number().min(0).optional(),
  comparePrice: Joi.number().min(0).optional().allow(null, ''),
  costPrice: Joi.number().min(0).optional().allow(null, ''),
  categoryId: Joi.string().uuid().optional().allow(null, ''),
  brandId: Joi.string().uuid().optional().allow(null, ''),
  tags: Joi.array().items(Joi.string()).optional(),
  sku: Joi.string().optional().allow(null, ''),
  barcode: Joi.string().optional().allow(null, ''),
  weight: Joi.number().min(0).optional().allow(null, ''),
  weightUnit: Joi.string().valid('kg', 'g', 'lb', 'oz').optional(),
  trackQuantity: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  isPhysical: Joi.boolean().optional(),
  images: Joi.array().items(imageSchema).optional(),
  variants: Joi.array().items(variantSchema).optional(),
  metaTitle: Joi.string().max(70).optional().allow(''),
  metaDescription: Joi.string().max(160).optional().allow(''),
  metaKeywords: Joi.string().max(255).optional().allow(''),
  stock: Joi.number().integer().min(0).optional(),
});

const bulkUploadSchema = Joi.object({
  products: Joi.array().items(createProductSchema).min(1).required(),
});

const updateProductSEOSchema = Joi.object({
  metaTitle: Joi.string().max(70).optional().allow(''),
  metaDescription: Joi.string().max(160).optional().allow(''),
  metaKeywords: Joi.string().max(255).optional().allow(''),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  bulkUploadSchema,
  updateProductSEOSchema,
};
