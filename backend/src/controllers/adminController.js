const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { sanitizeUser, calculatePagination, getPaginationMeta } = require('../utils/helpers');

const adminController = {
  async getDashboardStats(req, res, next) {
    try {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        totalStores,
        totalUsers,
        totalOrders,
        revenueResult,
        lastMonthOrders,
        lastMonthRevenue,
        storesThisMonth,
        usersThisMonth,
        recentOrders,
        recentUsers,
      ] = await Promise.all([
        prisma.store.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.order.count({ where: { deletedAt: null } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { deletedAt: null } }),
        prisma.order.count({ where: { createdAt: { gte: firstOfLastMonth, lt: firstOfMonth }, deletedAt: null } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: firstOfLastMonth, lt: firstOfMonth }, deletedAt: null } }),
        prisma.store.count({ where: { createdAt: { gte: firstOfMonth }, deletedAt: null } }),
        prisma.user.count({ where: { createdAt: { gte: firstOfMonth }, deletedAt: null } }),
        prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { store: { select: { name: true } }, user: { select: { firstName: true, lastName: true, email: true } } } }),
        prisma.user.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { role: true } }),
      ]);

      const revenue = Number(revenueResult._sum.total || 0);
      const lastMonthRev = Number(lastMonthRevenue._sum.total || 0);
      const revenueGrowth = lastMonthRev > 0 ? ((revenue - lastMonthRev) / lastMonthRev) * 100 : 0;
      const orderGrowth = lastMonthOrders > 0 ? ((totalOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;
      const storeGrowth = storesThisMonth;
      const userGrowth = usersThisMonth;

      ApiResponse.success(res, {
        stores: { total: totalStores, growth: storeGrowth },
        users: { total: totalUsers, growth: userGrowth },
        revenue: { total: revenue, growth: Math.round(revenueGrowth * 100) / 100 },
        orders: { total: totalOrders, growth: Math.round(orderGrowth * 100) / 100 },
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          store: o.store.name,
          customer: o.user ? `${o.user.firstName} ${o.user.lastName}` : 'Guest',
          createdAt: o.createdAt,
        })),
        recentUsers: recentUsers.map((u) => sanitizeUser(u)),
      });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const { page, limit, search, role } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { deletedAt: null };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = { name: role };
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { role: true },
        }),
        prisma.user.count({ where }),
      ]);

      ApiResponse.paginated(
        res,
        users.map((u) => sanitizeUser(u)),
        getPaginationMeta(total, pageNum, limitNum),
      );
    } catch (error) {
      next(error);
    }
  },

  async getUser(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { role: true },
      });

      if (!user || user.deletedAt) {
        throw new ApiError(404, 'User not found');
      }

      ApiResponse.success(res, sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { role, isActive } = req.body;
      const data = {};

      if (role !== undefined) {
        const roleRecord = await prisma.role.findUnique({ where: { name: role } });
        if (!roleRecord) throw new ApiError(400, 'Invalid role');
        data.roleId = roleRecord.id;
      }

      if (isActive !== undefined) {
        data.isActive = isActive;
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        include: { role: true },
      });

      ApiResponse.success(res, sanitizeUser(user), 'User updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user || user.deletedAt) {
        throw new ApiError(404, 'User not found');
      }

      await prisma.user.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false },
      });

      ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStores(req, res, next) {
    try {
      const { page, limit, search, status, verified } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { deletedAt: null };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status === 'active') where.isActive = true;
      if (status === 'suspended') where.isActive = false;
      if (verified === 'true') where.isVerified = true;
      if (verified === 'false') where.isVerified = false;

      const [stores, total] = await Promise.all([
        prisma.store.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, email: true } },
            _count: { select: { products: true, orders: true } },
          },
        }),
        prisma.store.count({ where }),
      ]);

      const storesWithRevenue = await Promise.all(
        stores.map(async (store) => {
          const revenue = await prisma.order.aggregate({
            _sum: { total: true },
            where: { storeId: store.id, deletedAt: null },
          });
          return {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logo: store.logo,
            isActive: store.isActive,
            isVerified: store.isVerified,
            owner: store.owner,
            productsCount: store._count.products,
            ordersCount: store._count.orders,
            revenue: Number(revenue._sum.total || 0),
            createdAt: store.createdAt,
          };
        }),
      );

      ApiResponse.paginated(res, storesWithRevenue, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getStoreDetail(req, res, next) {
    try {
      const store = await prisma.store.findUnique({
        where: { id: req.params.id },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          settings: true,
          theme: true,
          _count: { select: { products: true, orders: true, customers: true, coupons: true } },
        },
      });

      if (!store || store.deletedAt) {
        throw new ApiError(404, 'Store not found');
      }

      const revenue = await prisma.order.aggregate({
        _sum: { total: true },
        where: { storeId: store.id, deletedAt: null },
      });

      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        where: { storeId: store.id, deletedAt: null },
        _count: true,
      });

      ApiResponse.success(res, {
        ...store,
        revenue: Number(revenue._sum.total || 0),
        orderStatusDistribution: ordersByStatus.map((o) => ({ status: o.status, count: o._count })),
      });
    } catch (error) {
      next(error);
    }
  },

  async approveStore(req, res, next) {
    try {
      const { isVerified, rejectionReason } = req.body;

      const store = await prisma.store.findUnique({ where: { id: req.params.id } });
      if (!store || store.deletedAt) {
        throw new ApiError(404, 'Store not found');
      }

      const updated = await prisma.store.update({
        where: { id: req.params.id },
        data: {
          isVerified: isVerified ?? true,
          ...(isVerified === false && rejectionReason ? { metadata: { rejectionReason } } : {}),
        },
        include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      ApiResponse.success(res, updated, isVerified !== false ? 'Store approved successfully' : 'Store rejected');
    } catch (error) {
      next(error);
    }
  },

  async suspendStore(req, res, next) {
    try {
      const store = await prisma.store.findUnique({ where: { id: req.params.id } });
      if (!store || store.deletedAt) {
        throw new ApiError(404, 'Store not found');
      }

      const updated = await prisma.store.update({
        where: { id: req.params.id },
        data: { isActive: !store.isActive },
        include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });

      ApiResponse.success(
        res,
        updated,
        updated.isActive ? 'Store activated successfully' : 'Store suspended successfully',
      );
    } catch (error) {
      next(error);
    }
  },

  async getPlans(req, res, next) {
    try {
      const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
      ApiResponse.success(res, plans);
    } catch (error) {
      if (error.code === 'P2021') {
        ApiResponse.success(res, [], 'Plan management not configured');
      } else {
        next(error);
      }
    }
  },

  async createPlan(req, res, next) {
    try {
      const { name, description, price, interval, features, isActive } = req.body;

      const plan = await prisma.plan.create({
        data: { name, description, price, interval, features: features || [], isActive: isActive ?? true },
      });

      ApiResponse.created(res, plan, 'Plan created successfully');
    } catch (error) {
      if (error.code === 'P2021') {
        next(new ApiError(501, 'Plan management not configured. Add Plan model to schema.'));
      } else {
        next(error);
      }
    }
  },

  async updatePlan(req, res, next) {
    try {
      const { name, description, price, interval, features, isActive } = req.body;

      const plan = await prisma.plan.update({
        where: { id: req.params.id },
        data: { name, description, price, interval, features, isActive },
      });

      ApiResponse.success(res, plan, 'Plan updated successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        next(new ApiError(404, 'Plan not found'));
      } else {
        next(error);
      }
    }
  },

  async deletePlan(req, res, next) {
    try {
      await prisma.plan.delete({ where: { id: req.params.id } });
      ApiResponse.success(res, null, 'Plan deleted successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        next(new ApiError(404, 'Plan not found'));
      } else {
        next(error);
      }
    }
  },

  async getThemes(req, res, next) {
    try {
      const themes = await prisma.storeTheme.findMany({
        distinct: ['name'],
        orderBy: { createdAt: 'desc' },
      });

      const themeNames = [...new Set(themes.map((t) => t.name))];
      const presets = themeNames.map((name) => {
        const theme = themes.find((t) => t.name === name);
        return {
          name: theme.name,
          colors: theme.colors,
          fonts: theme.fonts,
          layout: theme.layout,
        };
      });

      ApiResponse.success(res, presets.length > 0 ? presets : [
        { name: 'Light', colors: { primary: '#3b82f6', background: '#ffffff', text: '#1e293b' }, fonts: { heading: 'Inter', body: 'Inter' }, layout: { style: 'standard' } },
        { name: 'Dark', colors: { primary: '#60a5fa', background: '#0f172a', text: '#f1f5f9' }, fonts: { heading: 'Inter', body: 'Inter' }, layout: { style: 'standard' } },
        { name: 'Minimal', colors: { primary: '#000000', background: '#ffffff', text: '#000000' }, fonts: { heading: 'Inter', body: 'Inter' }, layout: { style: 'minimal' } },
      ]);
    } catch (error) {
      next(error);
    }
  },

  async activateTheme(req, res, next) {
    try {
      const { name } = req.body;
      if (!name) throw new ApiError(400, 'Theme name is required');

      const themes = await prisma.storeTheme.findMany({
        where: { name, isActive: true },
      });

      ApiResponse.success(res, { activated: name, storesUsing: themes.length }, 'Theme activated');
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { deletedAt: null };
      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take,
          orderBy: { name: 'asc' },
          include: { _count: { select: { products: true } }, store: { select: { name: true } } },
        }),
        prisma.category.count({ where }),
      ]);

      ApiResponse.paginated(res, categories, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name, description, storeId, parentId } = req.body;

      if (!storeId) {
        throw new ApiError(400, 'storeId is required');
      }

      const slug = require('../utils/helpers').generateSlug(name);

      const existing = await prisma.category.findUnique({ where: { storeId_slug: { storeId, slug } } });
      if (existing) {
        throw new ApiError(409, 'Category with this name already exists in this store');
      }

      const category = await prisma.category.create({
        data: { name, slug, description, storeId, parentId: parentId || null },
      });

      ApiResponse.created(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { name, description, isActive, parentId } = req.body;
      const data = {};

      if (name !== undefined) {
        data.name = name;
        data.slug = require('../utils/helpers').generateSlug(name);
      }
      if (description !== undefined) data.description = description;
      if (isActive !== undefined) data.isActive = isActive;
      if (parentId !== undefined) data.parentId = parentId;

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data,
      });

      ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      await prisma.category.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });

      ApiResponse.success(res, null, 'Category deleted successfully');
    } catch (error) {
      if (error.code === 'P2025') {
        next(new ApiError(404, 'Category not found'));
      } else {
        next(error);
      }
    }
  },

  async getPayments(req, res, next) {
    try {
      const { page, limit, status, method } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = {};
      if (status) where.status = status;
      if (method) where.method = method;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { order: { select: { orderNumber: true, store: { select: { name: true } } } } },
        }),
        prisma.payment.count({ where }),
      ]);

      ApiResponse.paginated(res, payments, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getPaymentDetail(req, res, next) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: {
          order: {
            include: {
              store: { select: { name: true, slug: true } },
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
          transactions: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!payment) {
        throw new ApiError(404, 'Payment not found');
      }

      ApiResponse.success(res, payment);
    } catch (error) {
      next(error);
    }
  },

  async getReports(req, res, next) {
    try {
      const { type, page, limit } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = {};
      if (type) where.type = type;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { store: { select: { name: true, slug: true } } },
        }),
        prisma.report.count({ where }),
      ]);

      ApiResponse.paginated(res, reports, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getCoupons(req, res, next) {
    try {
      const { page, limit, search, isActive } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { deletedAt: null };
      if (search) where.code = { contains: search, mode: 'insensitive' };
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { store: { select: { name: true, slug: true } } },
        }),
        prisma.coupon.count({ where }),
      ]);

      ApiResponse.paginated(res, coupons, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getNotifications(req, res, next) {
    try {
      const { page, limit, type, isRead } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = {};
      if (type) where.type = type;
      if (isRead !== undefined) where.isRead = isRead === 'true';

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        }),
        prisma.notification.count({ where }),
      ]);

      ApiResponse.paginated(res, notifications, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getSettings(req, res, next) {
    try {
      const settings = {
        platformName: process.env.APP_NAME || 'Commerce Platform',
        supportEmail: process.env.SUPPORT_EMAIL || '',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
        registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
        defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
        maxStoresPerUser: parseInt(process.env.MAX_STORES_PER_USER) || 1,
        trialDays: parseInt(process.env.TRIAL_DAYS) || 14,
      };

      const dbSettings = await prisma.storeSettings.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      ApiResponse.success(res, { ...settings, dbSettings });
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const {
        platformName,
        supportEmail,
        maintenanceMode,
        registrationEnabled,
        defaultCurrency,
        defaultLanguage,
        maxStoresPerUser,
        trialDays,
      } = req.body;

      const settings = {};
      if (platformName !== undefined) settings.APP_NAME = platformName;
      if (supportEmail !== undefined) settings.SUPPORT_EMAIL = supportEmail;
      if (maintenanceMode !== undefined) settings.MAINTENANCE_MODE = String(maintenanceMode);
      if (registrationEnabled !== undefined) settings.REGISTRATION_ENABLED = String(registrationEnabled);
      if (defaultCurrency !== undefined) settings.DEFAULT_CURRENCY = defaultCurrency;
      if (defaultLanguage !== undefined) settings.DEFAULT_LANGUAGE = defaultLanguage;
      if (maxStoresPerUser !== undefined) settings.MAX_STORES_PER_USER = String(maxStoresPerUser);
      if (trialDays !== undefined) settings.TRIAL_DAYS = String(trialDays);

      ApiResponse.success(res, settings, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMerchants(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status, isVerified } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { role: { name: 'STORE_OWNER' } };
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (isVerified !== undefined) where.ownedStore = { isVerified: isVerified === 'true' };
      if (status === 'active') where.isActive = true;
      if (status === 'inactive') where.isActive = false;

      const [merchants, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            ownedStore: { select: { id: true, name: true, slug: true, isVerified: true, isActive: true, _count: { select: { products: true, orders: true } } } },
            _count: { select: { orders: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.user.count({ where }),
      ]);

      ApiResponse.paginated(res, merchants.map(sanitizeUser), getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getMerchantDetail(req, res, next) {
    try {
      const { id } = req.params;
      const merchant = await prisma.user.findFirst({
        where: { id, role: { name: 'STORE_OWNER' } },
        include: {
          ownedStore: {
            include: {
              _count: { select: { products: true, orders: true, customers: true } },
              settings: true,
            },
          },
          _count: { select: { orders: true } },
        },
      });

      if (!merchant) throw new ApiError(404, 'Merchant not found');
      ApiResponse.success(res, sanitizeUser(merchant));
    } catch (error) {
      next(error);
    }
  },

  async verifyMerchant(req, res, next) {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const merchant = await prisma.user.findFirst({
        where: { id, role: { name: 'STORE_OWNER' } },
        include: { ownedStore: true },
      });

      if (!merchant || !merchant.ownedStore) throw new ApiError(404, 'Merchant or store not found');

      await prisma.store.update({
        where: { id: merchant.ownedStore.id },
        data: { isVerified },
      });

      ApiResponse.success(res, null, `Store ${isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      next(error);
    }
  },

  async blockMerchant(req, res, next) {
    try {
      const { id } = req.params;

      const merchant = await prisma.user.findFirst({
        where: { id, role: { name: 'STORE_OWNER' } },
        include: { ownedStore: true },
      });

      if (!merchant) throw new ApiError(404, 'Merchant not found');

      const newStatus = !merchant.isActive;
      await prisma.user.update({ where: { id }, data: { isActive: newStatus } });

      if (merchant.ownedStore) {
        await prisma.store.update({ where: { id: merchant.ownedStore.id }, data: { isActive: newStatus } });
      }

      ApiResponse.success(res, null, `Merchant ${newStatus ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      next(error);
    }
  },

  async deleteMerchant(req, res, next) {
    try {
      const { id } = req.params;
      const merchant = await prisma.user.findFirst({
        where: { id, role: { name: 'STORE_OWNER' } },
        include: { ownedStore: true },
      });

      if (!merchant) throw new ApiError(404, 'Merchant not found');

      if (merchant.ownedStore) {
        await prisma.store.update({ where: { id: merchant.ownedStore.id }, data: { deletedAt: new Date() } });
      }
      await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });

      ApiResponse.success(res, null, 'Merchant deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getAllBrands(req, res, next) {
    try {
      const { page = 1, limit = 20, search, isActive } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { store: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [brands, total] = await Promise.all([
        prisma.brand.findMany({
          where,
          include: { store: { select: { id: true, name: true, slug: true } }, _count: { select: { products: true } } },
          orderBy: { name: 'asc' },
          skip,
          take,
        }),
        prisma.brand.count({ where }),
      ]);

      ApiResponse.paginated(res, brands, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async createBrand(req, res, next) {
    try {
      const { name, description, logo, website, storeId } = req.body;
      const { generateSlug } = require('../utils/helpers');
      const slug = generateSlug(name);

      const existing = await prisma.brand.findUnique({ where: { storeId_slug: { storeId, slug } } });
      if (existing) throw new ApiError(409, 'Brand already exists in this store');

      const brand = await prisma.brand.create({
        data: { storeId, name, slug, description, logo, website },
      });

      ApiResponse.created(res, brand, 'Brand created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateBrand(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, logo, website, isActive } = req.body;
      const { generateSlug } = require('../utils/helpers');

      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) throw new ApiError(404, 'Brand not found');

      const data = {};
      if (name !== undefined) {
        data.name = name;
        data.slug = generateSlug(name);
      }
      if (description !== undefined) data.description = description;
      if (logo !== undefined) data.logo = logo;
      if (website !== undefined) data.website = website;
      if (isActive !== undefined) data.isActive = isActive;

      const updated = await prisma.brand.update({ where: { id }, data });
      ApiResponse.success(res, updated, 'Brand updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteBrand(req, res, next) {
    try {
      const { id } = req.params;
      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) throw new ApiError(404, 'Brand not found');

      await prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
      ApiResponse.success(res, null, 'Brand deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getSubscriptions(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const subscriptions = await prisma.subscription.findMany({
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });

      ApiResponse.paginated(res, subscriptions, getPaginationMeta(subscriptions.length, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getSubscriptionDetail(req, res, next) {
    try {
      const { id } = req.params;
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } } },
      });

      if (!subscription) throw new ApiError(404, 'Subscription not found');
      ApiResponse.success(res, subscription);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminController;
