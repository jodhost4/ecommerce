const crypto = require('crypto');
const slugify = require('slugify');

function generateSlug(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

function generateSKU(storeCode, categoryCode, productCode) {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${storeCode}-${categoryCode}-${productCode}-${timestamp}`;
}

function generateBarcode() {
  const prefix = 'COM';
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}${timestamp}${random}`;
}

function generateOrderNumber(storeCode) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${storeCode}-${timestamp}${random}`;
}

function generateCouponCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function calculatePagination(page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  return { skip, take: limitNum, page: pageNum, limit: limitNum };
}

function getPaginationMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, refreshToken, resetPasswordToken, resetPasswordExpires, verificationToken, ...sanitized } = user;
  return sanitized;
}

module.exports = {
  generateSlug,
  generateSKU,
  generateBarcode,
  generateOrderNumber,
  generateCouponCode,
  calculatePagination,
  getPaginationMeta,
  sanitizeUser,
};
