const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const reportController = {
  async getSalesReport(req, res, next) {
    try {
      const storeId = req.store.id;
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const start = new Date(startDate || new Date(new Date().setDate(new Date().getDate() - 30)));
      const end = new Date(endDate || new Date());

      const orders = await prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        orderBy: { createdAt: 'asc' },
      });

      const grouped = {};
      orders.forEach((order) => {
        const date = new Date(order.createdAt);
        let key;
        if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) {
          grouped[key] = { date: key, sales: 0, orders: 0, items: 0 };
        }
        grouped[key].sales += Number(order.total);
        grouped[key].orders += 1;
        grouped[key].items += 1;
      });

      const data = Object.values(grouped);
      const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
      const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

      ApiResponse.success(res, {
        summary: {
          totalSales,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        },
        data,
        groupBy,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRevenueReport(req, res, next) {
    try {
      const storeId = req.store.id;
      const { startDate, endDate } = req.query;

      const start = new Date(startDate || new Date(new Date().setDate(new Date().getDate() - 30)));
      const end = new Date(endDate || new Date());

      const orders = await prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        include: { orderItems: true },
      });

      const breakdown = {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discounts: 0,
        total: 0,
      };

      const categoryRevenue = {};

      for (const order of orders) {
        breakdown.subtotal += Number(order.subtotal);
        breakdown.tax += Number(order.taxAmount);
        breakdown.shipping += Number(order.shippingAmount);
        breakdown.discounts += Number(order.discountAmount);
        breakdown.total += Number(order.total);

        for (const item of order.orderItems) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { category: true },
          });
          const catName = product?.category?.name || 'Uncategorized';
          categoryRevenue[catName] = (categoryRevenue[catName] || 0) + Number(item.total);
        }
      }

      ApiResponse.success(res, {
        breakdown,
        categoryRevenue: Object.entries(categoryRevenue).map(([name, value]) => ({ name, value })),
        orderCount: orders.length,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCustomerReport(req, res, next) {
    try {
      const storeId = req.store.id;
      const { startDate, endDate } = req.query;

      const start = new Date(startDate || new Date(new Date().setDate(new Date().getDate() - 30)));
      const end = new Date(endDate || new Date());
      const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));

      const [currentCustomers, previousCustomers, totalCustomers, totalOrders, topCustomers] = await Promise.all([
        prisma.customer.findMany({ where: { storeId, createdAt: { gte: start, lte: end } } }),
        prisma.customer.findMany({ where: { storeId, createdAt: { gte: previousStart, lte: start } } }),
        prisma.customer.count({ where: { storeId } }),
        prisma.order.count({ where: { storeId, status: { not: 'CANCELLED' } } }),
        prisma.customer.findMany({
          where: { storeId },
          orderBy: { totalSpent: 'desc' },
          take: 10,
          include: { _count: { select: { orders: true } } },
        }),
      ]);

      ApiResponse.success(res, {
        newCustomers: currentCustomers.length,
        previousPeriodCustomers: previousCustomers.length,
        totalCustomers,
        totalOrders,
        repeatRate: totalCustomers > 0 ? currentCustomers.filter((c) => c.totalOrders > 1).length / totalCustomers : 0,
        topCustomers: topCustomers.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          orders: c._count.orders,
          totalSpent: Number(c.totalSpent),
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  async getProductReport(req, res, next) {
    try {
      const storeId = req.store.id;
      const { startDate, endDate } = req.query;

      const start = new Date(startDate || new Date(new Date().setDate(new Date().getDate() - 30)));
      const end = new Date(endDate || new Date());

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            storeId,
            createdAt: { gte: start, lte: end },
            status: { not: 'CANCELLED' },
          },
        },
        include: {
          product: { include: { category: true } },
        },
      });

      const productMap = {};
      const categoryMap = {};

      for (const item of orderItems) {
        const pid = item.productId;
        if (!productMap[pid]) {
          productMap[pid] = {
            id: pid,
            name: item.product.name,
            sku: item.sku || item.product.sku || 'N/A',
            category: item.product.category?.name || 'Uncategorized',
            unitsSold: 0,
            revenue: 0,
          };
        }
        productMap[pid].unitsSold += item.quantity;
        productMap[pid].revenue += Number(item.total);

        const cat = item.product.category?.name || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(item.total);
      }

      const products = Object.values(productMap);
      const topSellers = [...products].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
      const lowPerformers = [...products].sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 10);

      ApiResponse.success(res, {
        topSellers,
        lowPerformers,
        categoryBreakdown: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
        totalProductsSold: orderItems.reduce((sum, i) => sum + i.quantity, 0),
        totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
      });
    } catch (error) {
      next(error);
    }
  },

  async getInventoryReport(req, res, next) {
    try {
      const storeId = req.store.id;

      const products = await prisma.product.findMany({
        where: { storeId, isActive: true },
        include: {
          inventory: true,
          variants: { include: { inventory: true } },
        },
      });

      let totalStock = 0;
      let totalValue = 0;
      const lowStockItems = [];

      for (const product of products) {
        let stock = 0;
        const costPrice = Number(product.costPrice || product.basePrice);

        if (product.variants.length > 0) {
          stock = product.variants.reduce((s, v) => {
            return s + v.inventory.reduce((vs, i) => vs + i.quantity, 0);
          }, 0);
        } else if (product.inventory.length > 0) {
          stock = product.inventory.reduce((s, i) => s + i.quantity, 0);
        }

        totalStock += stock;
        totalValue += stock * costPrice;

        if (stock <= (product.inventory[0]?.lowStockThreshold || 10)) {
          lowStockItems.push({
            id: product.id,
            name: product.name,
            sku: product.sku || 'N/A',
            stock,
            value: stock * costPrice,
            threshold: product.inventory[0]?.lowStockThreshold || 10,
          });
        }
      }

      ApiResponse.success(res, {
        totalProducts: products.length,
        totalStock,
        totalValue,
        lowStockItems: lowStockItems.sort((a, b) => a.stock - b.stock),
        lowStockCount: lowStockItems.length,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrderReport(req, res, next) {
    try {
      const storeId = req.store.id;
      const { startDate, endDate } = req.query;

      const start = new Date(startDate || new Date(new Date().setDate(new Date().getDate() - 30)));
      const end = new Date(endDate || new Date());

      const orders = await prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: start, lte: end },
        },
        include: { shipping: true },
        orderBy: { createdAt: 'desc' },
      });

      const statusCounts = {};
      let totalFulfillmentTime = 0;
      let fulfilledOrders = 0;

      for (const order of orders) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

        if (order.shipping?.deliveredAt && order.createdAt) {
          const fulfillmentTime = (new Date(order.shipping.deliveredAt) - new Date(order.createdAt)) / (1000 * 60 * 60);
          totalFulfillmentTime += fulfillmentTime;
          fulfilledOrders++;
        }
      }

      ApiResponse.success(res, {
        totalOrders: orders.length,
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        averageFulfillmentTime: fulfilledOrders > 0 ? totalFulfillmentTime / fulfilledOrders : 0,
        ordersByDate: Array.from({ length: 7 }, (_, i) => {
          const d = new Date(end);
          d.setDate(d.getDate() - (6 - i));
          const key = d.toISOString().split('T')[0];
          return {
            date: key,
            count: orders.filter((o) => o.createdAt.toISOString().split('T')[0] === key).length,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  },

  async exportReport(req, res, next) {
    try {
      const { type, format } = req.params;
      const { startDate, endDate } = req.query;

      const reportHandlers = {
        sales: 'getSalesReport',
        revenue: 'getRevenueReport',
        customers: 'getCustomerReport',
        products: 'getProductReport',
        inventory: 'getInventoryReport',
        orders: 'getOrderReport',
      };

      if (!reportHandlers[type]) {
        throw new ApiError(400, 'Invalid report type');
      }

      const mockReq = { store: req.store, query: { startDate, endDate }, user: req.user };
      let reportData;
      await reportController[reportHandlers[type]](mockReq, {
        status: () => ({
          json: (data) => {
            reportData = data;
          },
        }),
        json: (data) => { reportData = data; },
      }, next);

      if (!reportData) {
        throw new ApiError(500, 'Failed to generate report data');
      }

      const dataArray = reportData.data?.data || reportData.data || [];

      if (format === 'csv') {
        const { Parser } = require('json2csv');
        const fields = dataArray.length > 0 ? Object.keys(dataArray[0]) : [];
        const parser = new Parser({ fields });
        const csv = parser.parse(dataArray);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
        return res.send(csv);
      }

      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`${type} Report`);
        if (dataArray.length > 0) {
          sheet.columns = Object.keys(dataArray[0]).map((key) => ({ header: key, key }));
          dataArray.forEach((row) => sheet.addRow(row));
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
        await workbook.xlsx.write(res);
        return res.end();
      }

      throw new ApiError(400, 'Invalid export format. Use csv or excel.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reportController;
