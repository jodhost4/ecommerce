const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta, generateOrderNumber } = require('../utils/helpers');

const orderController = {
  async getOrders(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { storeId, deletedAt: null };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            customer: { select: { id: true, firstName: true, lastName: true, email: true } },
            payment: { select: { status: true, method: true } },
            shipping: { select: { status: true, carrier: true, trackingNumber: true } },
            orderItems: { select: { id: true, name: true, quantity: true, total: true } },
            _count: { select: { orderItems: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take,

        }),
        prisma.order.count({ where }),
      ]);

      ApiResponse.paginated(res, orders, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getOrder(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const order = await prisma.order.findFirst({
        where: { id, storeId },
        include: {
          customer: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          orderItems: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
              variant: { select: { id: true, name: true, options: true } },
            },
          },
          payment: { include: { transactions: { orderBy: { createdAt: 'desc' } } } },
          shipping: true,
          timeline: { orderBy: { createdAt: 'desc' } },
          coupon: { select: { id: true, code: true, type: true, value: true } },
        },
      });

      if (!order) throw new ApiError(404, 'Order not found');

      ApiResponse.success(res, order);
    } catch (error) {
      next(error);
    }
  },

  async createOrder(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const user = req.user;
      const {
        customerId, items, notes, billingAddress, shippingAddress,
        shippingAmount = 0, discountAmount = 0, couponCode,
      } = req.body;

      if (!items || items.length === 0) throw new ApiError(400, 'Order must have at least one item');

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: { settings: true },
      });

      const orderNumber = generateOrderNumber(store.settings?.orderPrefix || 'ORD');

      let coupon = null;
      let appliedDiscount = discountAmount;
      if (couponCode) {
        coupon = await prisma.coupon.findUnique({
          where: { storeId_code: { storeId, code: couponCode } },
        });
        if (!coupon || !coupon.isActive) throw new ApiError(400, 'Invalid coupon');
        if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'Coupon expired');
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
        appliedDiscount = coupon.type === 'PERCENTAGE'
          ? Math.min(items.reduce((s, i) => s + Number(i.price) * i.quantity, 0) * Number(coupon.value) / 100, Number(coupon.maxDiscount || Infinity))
          : Number(coupon.value);
      }

      const order = await prisma.$transaction(async (tx) => {
        const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
        const total = subtotal + Number(shippingAmount) - appliedDiscount;

        const created = await tx.order.create({
          data: {
            orderNumber,
            storeId,
            customerId,
            userId: user.id,
            subtotal,
            discountAmount: appliedDiscount,
            shippingAmount,
            taxAmount: 0,
            total,
            paidAmount: 0,
            dueAmount: total,
            couponId: coupon?.id || null,
            notes,
            billingAddress: billingAddress || undefined,
            shippingAddress: shippingAddress || undefined,
            orderItems: {
              create: items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId || null,
                name: item.name,
                sku: item.sku || null,
                price: item.price,
                quantity: item.quantity,
                total: Number(item.price) * item.quantity,
                image: item.image || null,
              })),
            },
            timeline: {
              create: { status: 'PENDING', note: 'Order created', userId: user.id },
            },
          },
          include: {
            orderItems: true,
            timeline: true,
            customer: true,
          },
        });

        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }

        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }

        return created;
      });

      ApiResponse.created(res, order, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const user = req.user;

      const order = await prisma.order.findFirst({
        where: { id, storeId: req.store?.id || req.user.ownedStore?.id },
      });
      if (!order) throw new ApiError(404, 'Order not found');

      const updated = await prisma.order.update({
        where: { id },
        data: { status },
      });

      await prisma.orderTimeline.create({
        data: {
          orderId: id,
          status,
          note: note || `Status changed to ${status}`,
          userId: user.id,
        },
      });

      if (status === 'CANCELLED') {
        for (const item of await prisma.orderItem.findMany({ where: { orderId: id } })) {
          if (item.variantId) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      ApiResponse.success(res, updated, 'Order status updated');
    } catch (error) {
      next(error);
    }
  },

  async getOrderTimeline(req, res, next) {
    try {
      const { id } = req.params;

      const timeline = await prisma.orderTimeline.findMany({
        where: { orderId: id },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });

      ApiResponse.success(res, timeline);
    } catch (error) {
      next(error);
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = req.user;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const order = await prisma.order.findFirst({
        where: { id, storeId },
        include: { orderItems: true },
      });
      if (!order) throw new ApiError(404, 'Order not found');
      if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
        throw new ApiError(400, `Order cannot be cancelled in ${order.status} status`);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.order.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        await tx.orderTimeline.create({
          data: {
            orderId: id,
            status: 'CANCELLED',
            note: reason || 'Order cancelled',
            userId: user.id,
          },
        });

        for (const item of order.orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        return cancelled;
      });

      ApiResponse.success(res, updated, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  },

  async getOrderInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const order = await prisma.order.findFirst({
        where: { id, storeId },
        include: {
          customer: true,
          orderItems: true,
          shipping: true,
          payment: { select: { method: true, status: true, transactionId: true } },
          store: { select: { name: true, email: true, phone: true, address: true, city: true, state: true, country: true, zipCode: true, logo: true } },
        },
      });

      if (!order) throw new ApiError(404, 'Order not found');

      const invoice = {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        store: order.store,
        customer: order.customer,
        billingAddress: order.billingAddress,
        shippingAddress: order.shippingAddress,
        items: order.orderItems,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        taxAmount: order.taxAmount,
        total: order.total,
        paidAmount: order.paidAmount,
        dueAmount: order.dueAmount,
        payment: order.payment,
        shipping: order.shipping,
      };

      ApiResponse.success(res, invoice);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = orderController;
