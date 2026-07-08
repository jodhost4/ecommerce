const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const merchantController = {
  async getDashboardStats(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;

      const [revenueAgg, ordersCount, customerCount, productCount, prevPeriod] = await Promise.all([
        prisma.order.aggregate({
          where: { storeId, status: { notIn: ['CANCELLED', 'RETURNED', 'REFUNDED'] }, deletedAt: null },
          _sum: { total: true },
        }),
        prisma.order.count({
          where: { storeId, deletedAt: null },
        }),
        prisma.customer.count({
          where: { storeId, deletedAt: null },
        }),
        prisma.product.count({
          where: { storeId, deletedAt: null },
        }),
        prisma.order.aggregate({
          where: {
            storeId,
            status: { notIn: ['CANCELLED', 'RETURNED', 'REFUNDED'] },
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              lt: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
            deletedAt: null,
          },
          _sum: { total: true },
        }),
      ]);

      const currentRevenue = Number(revenueAgg._sum.total) || 0;
      const prevRevenue = Number(prevPeriod._sum.total) || 0;
      const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      ApiResponse.success(res, {
        revenue: { total: currentRevenue, currency: 'USD' },
        orders: { total: ordersCount },
        customers: { total: customerCount },
        products: { total: productCount },
        growth: { percentage: Math.round(growth * 100) / 100, trend: growth >= 0 ? 'up' : 'down' },
      });
    } catch (error) {
      next(error);
    }
  },

  async getRevenueChart(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;
      const { period = 'daily' } = req.query;

      let dateFormat, startDate;
      const now = new Date();

      if (period === 'weekly') {
        startDate = new Date(now.setDate(now.getDate() - 90));
        dateFormat = 'week';
      } else if (period === 'monthly') {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        dateFormat = 'month';
      } else {
        startDate = new Date(now.setDate(now.getDate() - 30));
        dateFormat = 'day';
      }

      const orders = await prisma.order.findMany({
        where: {
          storeId,
          status: { notIn: ['CANCELLED', 'RETURNED', 'REFUNDED'] },
          createdAt: { gte: startDate },
          deletedAt: null,
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const revenueMap = {};
      orders.forEach((order) => {
        let key;
        if (dateFormat === 'month') {
          key = order.createdAt.toISOString().slice(0, 7);
        } else if (dateFormat === 'week') {
          const d = new Date(order.createdAt);
          const dayOfWeek = d.getDay();
          const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff));
          key = monday.toISOString().slice(0, 10);
        } else {
          key = order.createdAt.toISOString().slice(0, 10);
        }
        revenueMap[key] = (revenueMap[key] || 0) + Number(order.total);
      });

      const data = Object.entries(revenueMap).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }));

      ApiResponse.success(res, { period, data });
    } catch (error) {
      next(error);
    }
  },

  async getRecentOrders(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;

      const orders = await prisma.order.findMany({
        where: { storeId, deletedAt: null },
        include: {
          orderItems: { include: { product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } } } },
          customer: { select: { firstName: true, lastName: true, email: true } },
          payment: { select: { status: true, method: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      ApiResponse.success(res, orders);
    } catch (error) {
      next(error);
    }
  },

  async getRecentCustomers(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;

      const customers = await prisma.customer.findMany({
        where: { storeId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          totalOrders: true,
          totalSpent: true,
          createdAt: true,
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, createdAt: true, status: true, total: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const data = customers.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        totalOrders: c.totalOrders,
        totalSpent: Number(c.totalSpent),
        registeredAt: c.createdAt,
        lastOrder: c.orders[0] || null,
      }));

      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getTopProducts(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;
      const { limit = 10 } = req.query;

      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: { storeId, deletedAt: null, status: { notIn: ['CANCELLED', 'RETURNED', 'REFUNDED'] } },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: parseInt(limit),
      });

      const productIds = topProducts.map((p) => p.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true, basePrice: true, images: { where: { isPrimary: true }, take: 1 } },
      });

      const productMap = {};
      products.forEach((p) => { productMap[p.id] = p; });

      const data = topProducts.map((tp) => ({
        product: productMap[tp.productId] || { id: tp.productId },
        totalSold: tp._sum.quantity,
        totalRevenue: tp._sum.total,
      }));

      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = merchantController;
