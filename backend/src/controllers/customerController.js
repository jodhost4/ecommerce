const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const customerController = {
  async getCustomers(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { search, page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { storeId, deletedAt: null };
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          select: {
            id: true, email: true, firstName: true, lastName: true, phone: true,
            totalOrders: true, totalSpent: true, notes: true, createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take,

        }),
        prisma.customer.count({ where }),
      ]);

      ApiResponse.paginated(res, customers, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const customer = await prisma.customer.findFirst({
        where: { id, storeId, deletedAt: null },
        include: {
          addresses: { orderBy: { isDefault: 'desc' } },
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              orderItems: { take: 5, select: { name: true, quantity: true, total: true, image: true } },
            },
          },
          user: {
            select: {
              wishlistItems: {
                include: { product: { select: { id: true, name: true, slug: true, basePrice: true, images: { where: { isPrimary: true }, take: 1 } } } },
              },
              reviews: {
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { product: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });

      if (!customer) throw new ApiError(404, 'Customer not found');

      const result = {
        ...customer,
        wishlist: customer.user?.wishlistItems || [],
        reviews: customer.user?.reviews || [],
      };
      delete result.user;

      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async createCustomer(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { email, firstName, lastName, phone, notes } = req.body;

      const existing = await prisma.customer.findUnique({
        where: { storeId_email: { storeId, email } },
      });
      if (existing) throw new ApiError(409, 'Customer with this email already exists');

      const customer = await prisma.customer.create({
        data: { storeId, email, firstName, lastName, phone, notes },
      });

      ApiResponse.created(res, customer, 'Customer created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { email, firstName, lastName, phone, notes } = req.body;

      const customer = await prisma.customer.findFirst({ where: { id, storeId } });
      if (!customer) throw new ApiError(404, 'Customer not found');

      const updated = await prisma.customer.update({
        where: { id },
        data: { email, firstName, lastName, phone, notes },
      });

      ApiResponse.success(res, updated, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCustomerOrders(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { customerId: id, storeId };
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            orderItems: { select: { name: true, quantity: true, total: true, image: true } },
            payment: { select: { status: true, method: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...pagination,
        }),
        prisma.order.count({ where }),
      ]);

      ApiResponse.paginated(res, orders, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getCustomerAddresses(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const customer = await prisma.customer.findFirst({ where: { id, storeId } });
      if (!customer) throw new ApiError(404, 'Customer not found');

      const addresses = await prisma.address.findMany({
        where: { customerId: id },
        orderBy: { isDefault: 'desc' },
      });

      ApiResponse.success(res, addresses);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = customerController;
