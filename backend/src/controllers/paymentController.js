const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');
const stripe = require('../config/stripe');

const paymentController = {
  async createPaymentIntent(req, res, next) {
    try {
      const { orderId } = req.body;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { store: true },
      });
      if (!order) throw new ApiError(404, 'Order not found');

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.dueAmount) * 100),
        currency: order.currency.toLowerCase(),
        metadata: { orderId: order.id, storeId: order.storeId },
      });

      await prisma.payment.upsert({
        where: { orderId },
        update: { transactionId: paymentIntent.id, gatewayResponse: paymentIntent },
        create: {
          orderId,
          method: 'STRIPE',
          amount: order.dueAmount,
          currency: order.currency,
          transactionId: paymentIntent.id,
          gatewayResponse: paymentIntent,
        },
      });

      ApiResponse.success(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      next(error);
    }
  },

  async createRazorpayOrder(req, res, next) {
    try {
      const { orderId } = req.body;
      const Razorpay = require('razorpay');

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiError(404, 'Order not found');

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(order.dueAmount) * 100),
        currency: order.currency,
        receipt: order.orderNumber,
        notes: { orderId: order.id },
      });

      await prisma.payment.upsert({
        where: { orderId },
        update: { transactionId: razorpayOrder.id, gatewayResponse: razorpayOrder },
        create: {
          orderId,
          method: 'RAZORPAY',
          amount: order.dueAmount,
          currency: order.currency,
          transactionId: razorpayOrder.id,
          gatewayResponse: razorpayOrder,
        },
      });

      ApiResponse.success(res, {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmPayment(req, res, next) {
    try {
      const { orderId, method = 'COD', transactionId } = req.body;

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiError(404, 'Order not found');

      const payment = await prisma.payment.upsert({
        where: { orderId },
        update: {
          method,
          status: 'COMPLETED',
          transactionId: transactionId || `TXN-${Date.now()}`,
          paidAt: new Date(),
        },
        create: {
          orderId,
          method,
          status: 'COMPLETED',
          amount: order.dueAmount,
          currency: order.currency,
          transactionId: transactionId || `TXN-${Date.now()}`,
          paidAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paidAmount: order.total,
          dueAmount: 0,
          status: method === 'COD' ? 'CONFIRMED' : 'PROCESSING',
        },
      });

      await prisma.transaction.create({
        data: {
          paymentId: payment.id,
          type: 'PAYMENT',
          amount: order.dueAmount,
          currency: order.currency,
          status: 'COMPLETED',
          gateway: method,
          gatewayRef: transactionId,
        },
      });

      ApiResponse.success(res, payment, 'Payment confirmed successfully');
    } catch (error) {
      next(error);
    }
  },

  async getPayments(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { status, method, search, startDate, endDate, page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { order: { storeId } };
      if (status) where.status = status;
      if (method) where.method = method;
      if (search) where.order = { ...where.order, orderNumber: { contains: search, mode: 'insensitive' } };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            order: { select: { id: true, orderNumber: true, total: true, storeId: true } },
            _count: { select: { transactions: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take,

        }),
        prisma.payment.count({ where }),
      ]);

      ApiResponse.paginated(res, payments, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;

      const payment = await prisma.payment.findFirst({
        where: { id, order: { storeId } },
        include: {
          order: { include: { customer: true } },
          transactions: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!payment) throw new ApiError(404, 'Payment not found');

      ApiResponse.success(res, payment);
    } catch (error) {
      next(error);
    }
  },

  async processRefund(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const user = req.user;

      const storeId = req.store?.id || req.user.ownedStore?.id;
      const payment = await prisma.payment.findFirst({
        where: { id, order: { storeId } },
        include: { order: true },
      });
      if (!payment) throw new ApiError(404, 'Payment not found');

      const refundAmount = amount || Number(payment.amount) - Number(payment.refundedAmount);
      const maxRefund = Number(payment.amount) - Number(payment.refundedAmount);
      if (refundAmount > maxRefund) throw new ApiError(400, 'Refund amount exceeds remaining balance');

      let gatewayRefund = null;
      if (payment.method === 'STRIPE' && payment.transactionId) {
        gatewayRefund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: Math.round(refundAmount * 100),
        });
      }

      const newRefundedAmount = Number(payment.refundedAmount) + refundAmount;
      const newStatus = newRefundedAmount >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: {
            refundedAmount: newRefundedAmount,
            refundedAt: new Date(),
            status: newStatus,
          },
        });

        await tx.transaction.create({
          data: {
            paymentId: id,
            type: 'REFUND',
            amount: refundAmount,
            currency: payment.currency,
            status: 'COMPLETED',
            gateway: payment.method,
            gatewayRef: gatewayRefund?.id || null,
            notes: reason || 'Refund processed',
          },
        });

        if (newStatus === 'REFUNDED') {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: 'REFUNDED' },
          });
        }
      });

      ApiResponse.success(res, null, 'Refund processed successfully');
    } catch (error) {
      next(error);
    }
  },

  async getTransactions(req, res, next) {
    try {
      const { paymentId } = req.params;

      const transactions = await prisma.transaction.findMany({
        where: { paymentId },
        orderBy: { createdAt: 'desc' },
      });

      ApiResponse.success(res, transactions);
    } catch (error) {
      next(error);
    }
  },

  async getPaymentMethods(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: { settings: true },
      });

      const methods = [
        { id: 'stripe', name: 'Stripe', enabled: !!process.env.STRIPE_SECRET_KEY },
        { id: 'razorpay', name: 'Razorpay', enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) },
        { id: 'cod', name: 'Cash on Delivery', enabled: true },
      ];

      ApiResponse.success(res, methods);
    } catch (error) {
      next(error);
    }
  },

  async handleStripeWebhook(req, res, next) {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.orderId;

          await prisma.payment.update({
            where: { orderId },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
              gatewayResponse: paymentIntent,
            },
          });

          await prisma.order.update({
            where: { id: orderId },
            data: {
              paidAmount: Number(paymentIntent.amount) / 100,
              dueAmount: 0,
              status: 'PROCESSING',
            },
          });
          break;
        }

        case 'payment_intent.payment_failed': {
          const failedIntent = event.data.object;
          await prisma.payment.update({
            where: { orderId: failedIntent.metadata.orderId },
            data: { status: 'FAILED', gatewayResponse: failedIntent },
          });
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  },

  async handleRazorpayWebhook(req, res, next) {
    try {
      const { event, payload } = req.body;

      switch (event) {
        case 'payment.captured': {
          const payment = payload.payment.entity;
          const orderId = payment.notes?.orderId;

          if (orderId) {
            await prisma.payment.update({
              where: { orderId },
              data: {
                status: 'COMPLETED',
                paidAt: new Date(),
                transactionId: payment.id,
                gatewayResponse: payment,
              },
            });

            await prisma.order.update({
              where: { id: orderId },
              data: {
                paidAmount: Number(payment.amount) / 100,
                dueAmount: 0,
                status: 'PROCESSING',
              },
            });
          }
          break;
        }

        case 'payment.failed': {
          const failedPayment = payload.payment.entity;
          if (failedPayment.notes?.orderId) {
            await prisma.payment.update({
              where: { orderId: failedPayment.notes.orderId },
              data: { status: 'FAILED', gatewayResponse: failedPayment },
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = paymentController;
