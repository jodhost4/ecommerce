const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const shippingController = {
  async getShippingZones(req, res, next) {
    try {
      const { storeId } = req.store;

      const zones = await prisma.shippingZone.findMany({
        where: { storeId },
        include: {
          _count: { select: { rates: true } },
          rates: { where: { isActive: true }, select: { id: true, name: true, type: true, baseRate: true } },
        },
        orderBy: { name: 'asc' },
      });

      ApiResponse.success(res, zones);
    } catch (error) {
      next(error);
    }
  },

  async createShippingZone(req, res, next) {
    try {
      const { storeId } = req.store;
      const { name, countries = [], regions = [] } = req.body;

      const zone = await prisma.shippingZone.create({
        data: { storeId, name, countries, regions },
      });

      ApiResponse.created(res, zone, 'Shipping zone created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateShippingZone(req, res, next) {
    try {
      const { id } = req.params;
      const { storeId } = req.store;
      const { name, countries, regions, isActive } = req.body;

      const zone = await prisma.shippingZone.findFirst({ where: { id, storeId } });
      if (!zone) throw new ApiError(404, 'Shipping zone not found');

      const updated = await prisma.shippingZone.update({
        where: { id },
        data: { name, countries, regions, isActive },
      });

      ApiResponse.success(res, updated, 'Shipping zone updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteShippingZone(req, res, next) {
    try {
      const { id } = req.params;
      const { storeId } = req.store;

      const zone = await prisma.shippingZone.findFirst({ where: { id, storeId } });
      if (!zone) throw new ApiError(404, 'Shipping zone not found');

      await prisma.shippingZone.delete({ where: { id } });

      ApiResponse.success(res, null, 'Shipping zone deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getShippingRates(req, res, next) {
    try {
      const { zoneId } = req.params;

      const rates = await prisma.shippingRate.findMany({
        where: { zoneId },
        orderBy: { baseRate: 'asc' },
      });

      ApiResponse.success(res, rates);
    } catch (error) {
      next(error);
    }
  },

  async createShippingRate(req, res, next) {
    try {
      const { zoneId } = req.params;
      const {
        name, type, minValue, maxValue, minWeight, maxWeight,
        baseRate, perRate, estimatedDaysMin, estimatedDaysMax,
      } = req.body;

      const rate = await prisma.shippingRate.create({
        data: {
          zoneId,
          name,
          type: type || 'FLAT',
          minValue: minValue || undefined,
          maxValue: maxValue || undefined,
          minWeight: minWeight || undefined,
          maxWeight: maxWeight || undefined,
          baseRate,
          perRate: perRate || 0,
          estimatedDaysMin: estimatedDaysMin || undefined,
          estimatedDaysMax: estimatedDaysMax || undefined,
        },
      });

      ApiResponse.created(res, rate, 'Shipping rate created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateShippingRate(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name, type, minValue, maxValue, minWeight, maxWeight,
        baseRate, perRate, estimatedDaysMin, estimatedDaysMax, isActive,
      } = req.body;

      const rate = await prisma.shippingRate.findUnique({ where: { id } });
      if (!rate) throw new ApiError(404, 'Shipping rate not found');

      const updated = await prisma.shippingRate.update({
        where: { id },
        data: {
          name, type, minValue, maxValue, minWeight, maxWeight,
          baseRate, perRate, estimatedDaysMin, estimatedDaysMax, isActive,
        },
      });

      ApiResponse.success(res, updated, 'Shipping rate updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteShippingRate(req, res, next) {
    try {
      const { id } = req.params;

      const rate = await prisma.shippingRate.findUnique({ where: { id } });
      if (!rate) throw new ApiError(404, 'Shipping rate not found');

      await prisma.shippingRate.delete({ where: { id } });

      ApiResponse.success(res, null, 'Shipping rate deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getOrderShipping(req, res, next) {
    try {
      const { orderId } = req.params;
      const { storeId } = req.store;

      const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
      if (!order) throw new ApiError(404, 'Order not found');

      const shipping = await prisma.shipping.findUnique({
        where: { orderId },
      });

      if (!shipping) throw new ApiError(404, 'Shipping not found for this order');

      ApiResponse.success(res, shipping);
    } catch (error) {
      next(error);
    }
  },

  async updateTracking(req, res, next) {
    try {
      const { orderId } = req.params;
      const { carrier, method, trackingNumber, trackingUrl, status, estimatedDays } = req.body;
      const { storeId } = req.store;

      const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
      if (!order) throw new ApiError(404, 'Order not found');

      const shipping = await prisma.shipping.upsert({
        where: { orderId },
        update: {
          carrier, method, trackingNumber, trackingUrl, status, estimatedDays,
          ...(status === 'SHIPPED' ? { shippedAt: new Date() } : {}),
          ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
        create: {
          orderId,
          carrier, method, trackingNumber, trackingUrl,
          status: status || 'PROCESSING', estimatedDays,
        },
      });

      if (status) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: status === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED' },
        });
      }

      ApiResponse.success(res, shipping, 'Tracking updated successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = shippingController;
