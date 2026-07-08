const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const couponController = {
  async getCoupons(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { search, isActive, type, page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { storeId, deletedAt: null };
      if (search) {
        where.OR = [
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (type) where.type = type;

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take,

        }),
        prisma.coupon.count({ where }),
      ]);

      ApiResponse.paginated(res, coupons, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async createCoupon(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const {
        code, description, type, value, minOrderAmount, maxDiscount,
        usageLimit, perUserLimit, applicableProducts, applicableCategories,
        startsAt, expiresAt, isActive,
      } = req.body;

      if (!['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'].includes(type)) {
        throw new ApiError(400, 'Invalid discount type');
      }

      const existing = await prisma.coupon.findUnique({
        where: { storeId_code: { storeId, code: code.toUpperCase() } },
      });
      if (existing) throw new ApiError(409, 'Coupon code already exists');

      const coupon = await prisma.coupon.create({
        data: {
          storeId,
          code: code.toUpperCase(),
          description,
          type,
          value,
          minOrderAmount: minOrderAmount || undefined,
          maxDiscount: maxDiscount || undefined,
          usageLimit: usageLimit || undefined,
          perUserLimit: perUserLimit || 1,
          applicableProducts: applicableProducts || [],
          applicableCategories: applicableCategories || [],
          startsAt: startsAt ? new Date(startsAt) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      ApiResponse.created(res, coupon, 'Coupon created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const {
        code, description, type, value, minOrderAmount, maxDiscount,
        usageLimit, perUserLimit, applicableProducts, applicableCategories,
        startsAt, expiresAt, isActive,
      } = req.body;

      const coupon = await prisma.coupon.findFirst({ where: { id, storeId } });
      if (!coupon) throw new ApiError(404, 'Coupon not found');

      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          ...(code && { code: code.toUpperCase() }),
          description,
          type,
          value,
          minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : undefined,
          maxDiscount: maxDiscount !== undefined ? maxDiscount : undefined,
          usageLimit: usageLimit !== undefined ? usageLimit : undefined,
          perUserLimit: perUserLimit !== undefined ? perUserLimit : undefined,
          applicableProducts: applicableProducts || undefined,
          applicableCategories: applicableCategories || undefined,
          startsAt: startsAt ? new Date(startsAt) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          isActive,
        },
      });

      ApiResponse.success(res, updated, 'Coupon updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const coupon = await prisma.coupon.findFirst({ where: { id, storeId } });
      if (!coupon) throw new ApiError(404, 'Coupon not found');

      await prisma.coupon.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      ApiResponse.success(res, null, 'Coupon deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async validateCoupon(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { code, cartTotal } = req.body;

      const coupon = await prisma.coupon.findUnique({
        where: { storeId_code: { storeId, code: code.toUpperCase() } },
      });

      if (!coupon) throw new ApiError(404, 'Coupon not found');
      if (!coupon.isActive) throw new ApiError(400, 'Coupon is inactive');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'Coupon has expired');
      if (coupon.startsAt && coupon.startsAt > new Date()) throw new ApiError(400, 'Coupon is not yet active');
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
      if (coupon.minOrderAmount && Number(cartTotal) < Number(coupon.minOrderAmount)) {
        throw new ApiError(400, `Minimum order amount of ${coupon.minOrderAmount} required`);
      }

      let discount = 0;
      if (coupon.type === 'PERCENTAGE') {
        discount = (Number(cartTotal) * Number(coupon.value)) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
      } else if (coupon.type === 'FIXED') {
        discount = Number(coupon.value);
      }

      ApiResponse.success(res, {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
        },
        discount,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCouponReports(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { startDate, endDate } = req.query;

      const where = { storeId, deletedAt: null };
      const coupons = await prisma.coupon.findMany({
        where,
        include: {
          orders: {
            where: {
              ...(startDate || endDate ? {
                createdAt: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(endDate) } : {}),
                },
              } : {}),
            },
            select: {
              id: true, orderNumber: true, total: true, discountAmount: true, createdAt: true,
            },
          },
        },
        orderBy: { usedCount: 'desc' },
      });

      const reports = coupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        usedCount: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        totalDiscount: coupon.orders.reduce((sum, o) => sum + Number(o.discountAmount), 0),
        totalRevenue: coupon.orders.reduce((sum, o) => sum + Number(o.total), 0),
        orderCount: coupon.orders.length,
        orders: coupon.orders,
      }));

      ApiResponse.success(res, reports);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = couponController;
