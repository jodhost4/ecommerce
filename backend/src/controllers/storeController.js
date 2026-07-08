const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { generateSlug, sanitizeUser } = require('../utils/helpers');

const storeController = {
  async createStore(req, res, next) {
    try {
      const {
        name, description, businessCategory, email, phone, address, city, state, country, zipCode,
        logo, banner, currency, language, timezone, taxRate, shippingOrigin,
      } = req.body;

      let slug = generateSlug(name);
      const existing = await prisma.store.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const store = await prisma.store.create({
        data: {
          name,
          slug,
          description,
          businessCategory,
          email,
          phone,
          address,
          city,
          state,
          country,
          zipCode,
          logo,
          banner,
          ownerId: req.user.id,
          isActive: true,
          isVerified: false,
          settings: {
            create: {
              currency: currency || 'USD',
              language: language || 'en',
              timezone: timezone || 'UTC',
              taxRate: taxRate || 0,
              shippingOrigin: shippingOrigin || null,
            },
          },
          theme: {
            create: {
              name: 'Default',
              colors: { primary: '#3b82f6', secondary: '#10b981', background: '#ffffff', text: '#1e293b' },
              fonts: { heading: 'Inter', body: 'Inter' },
              layout: { style: 'standard', sidebar: false, homepage: 'default' },
            },
          },
        },
        include: { settings: true, theme: true },
      });

      ApiResponse.created(res, store, 'Store created successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStores(req, res, next) {
    try {
      const stores = await prisma.store.findMany({
        where: { ownerId: req.user.id, deletedAt: null },
        include: {
          settings: true,
          _count: { select: { products: true, orders: true, customers: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const storesWithRevenue = await Promise.all(
        stores.map(async (store) => {
          const revenue = await prisma.order.aggregate({
            _sum: { total: true },
            where: { storeId: store.id, deletedAt: null },
          });
          return {
            ...store,
            revenue: Number(revenue._sum.total || 0),
          };
        }),
      );

      ApiResponse.success(res, storesWithRevenue);
    } catch (error) {
      next(error);
    }
  },

  async getStore(req, res, next) {
    try {
      const { slug } = req.params;

      // Accept both UUID (id) and slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const where = isUuid ? { id: slug } : { slug };

      const store = await prisma.store.findUnique({
        where,
        include: {
          settings: true,
          theme: true,
          owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          _count: { select: { products: true, orders: true, customers: true, categories: true } },
        },
      });

      if (!store || store.deletedAt) {
        throw new ApiError(404, 'Store not found');
      }

      ApiResponse.success(res, store);
    } catch (error) {
      if (error.code === 'P2023') {
        next(new ApiError(404, 'Store not found'));
      } else {
        next(error);
      }
    }
  },

  async updateStore(req, res, next) {
    try {
      const {
        name, description, businessCategory, email, phone, address, city, state, country, zipCode,
        logo, banner,
      } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (businessCategory !== undefined) data.businessCategory = businessCategory;
      if (email !== undefined) data.email = email;
      if (phone !== undefined) data.phone = phone;
      if (address !== undefined) data.address = address;
      if (city !== undefined) data.city = city;
      if (state !== undefined) data.state = state;
      if (country !== undefined) data.country = country;
      if (zipCode !== undefined) data.zipCode = zipCode;
      if (logo !== undefined) data.logo = logo;
      if (banner !== undefined) data.banner = banner;

      const store = await prisma.store.update({
        where: { id: req.params.id },
        data,
        include: { settings: true, theme: true },
      });

      ApiResponse.success(res, store, 'Store updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteStore(req, res, next) {
    try {
      const store = await prisma.store.findUnique({ where: { id: req.params.id } });
      if (!store || store.deletedAt) {
        throw new ApiError(404, 'Store not found');
      }

      await prisma.store.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false },
      });

      ApiResponse.success(res, null, 'Store deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStoreSettings(req, res, next) {
    try {
      const settings = await prisma.storeSettings.findUnique({
        where: { storeId: req.params.id },
      });

      if (!settings) {
        throw new ApiError(404, 'Store settings not found');
      }

      ApiResponse.success(res, settings);
    } catch (error) {
      next(error);
    }
  },

  async updateStoreSettings(req, res, next) {
    try {
      const {
        currency, language, timezone, taxRate, taxIncluded, shippingOrigin,
        defaultWeightUnit, orderPrefix, lowStockThreshold, autoConfirmOrder,
        requireApproval, enableReviews, enableWishlist, enableCoupons,
      } = req.body;

      const data = {};
      if (currency !== undefined) data.currency = currency;
      if (language !== undefined) data.language = language;
      if (timezone !== undefined) data.timezone = timezone;
      if (taxRate !== undefined) data.taxRate = taxRate;
      if (taxIncluded !== undefined) data.taxIncluded = taxIncluded;
      if (shippingOrigin !== undefined) data.shippingOrigin = shippingOrigin;
      if (defaultWeightUnit !== undefined) data.defaultWeightUnit = defaultWeightUnit;
      if (orderPrefix !== undefined) data.orderPrefix = orderPrefix;
      if (lowStockThreshold !== undefined) data.lowStockThreshold = lowStockThreshold;
      if (autoConfirmOrder !== undefined) data.autoConfirmOrder = autoConfirmOrder;
      if (requireApproval !== undefined) data.requireApproval = requireApproval;
      if (enableReviews !== undefined) data.enableReviews = enableReviews;
      if (enableWishlist !== undefined) data.enableWishlist = enableWishlist;
      if (enableCoupons !== undefined) data.enableCoupons = enableCoupons;

      const settings = await prisma.storeSettings.upsert({
        where: { storeId: req.params.id },
        update: data,
        create: { storeId: req.params.id, ...data },
      });

      ApiResponse.success(res, settings, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStoreTheme(req, res, next) {
    try {
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId: req.params.id },
      });

      if (!theme) {
        throw new ApiError(404, 'Store theme not found');
      }

      ApiResponse.success(res, theme);
    } catch (error) {
      next(error);
    }
  },

  async updateStoreTheme(req, res, next) {
    try {
      const { name, colors, fonts, layout, header, footer, homepage, customCSS, isActive } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (colors !== undefined) data.colors = colors;
      if (fonts !== undefined) data.fonts = fonts;
      if (layout !== undefined) data.layout = layout;
      if (header !== undefined) data.header = header;
      if (footer !== undefined) data.footer = footer;
      if (homepage !== undefined) data.homepage = homepage;
      if (customCSS !== undefined) data.customCSS = customCSS;
      if (isActive !== undefined) data.isActive = isActive;

      const theme = await prisma.storeTheme.upsert({
        where: { storeId: req.params.id },
        update: data,
        create: { storeId: req.params.id, name: name || 'Default', colors: colors || {}, fonts: fonts || {}, layout: layout || {} },
      });

      ApiResponse.success(res, theme, 'Theme updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async publishStore(req, res, next) {
    try {
      const storeId = req.store?.id || req.params.id;
      const { publish } = req.body;

      const store = await prisma.store.update({
        where: { id: storeId },
        data: { isActive: publish !== false },
      });

      ApiResponse.success(res, store, `Store ${store.isActive ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      next(error);
    }
  },

  async checkDomain(req, res, next) {
    try {
      const { domain } = req.query;

      if (!domain) {
        throw new ApiError(400, 'Domain is required');
      }

      const existing = await prisma.store.findFirst({
        where: { slug: domain },
      });

      ApiResponse.success(res, {
        domain,
        available: !existing,
        message: existing ? 'Domain is already taken' : 'Domain is available',
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicStores(req, res, next) {
    try {
      const { isActive, limit = 6, page = 1 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = { deletedAt: null };
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const [stores, total] = await Promise.all([
        prisma.store.findMany({
          where,
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.store.count({ where }),
      ]);

      ApiResponse.success(res, {
        data: stores,
        pagination: {
          total,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = storeController;
