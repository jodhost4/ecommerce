const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { calculatePagination, getPaginationMeta, generateOrderNumber, sanitizeUser } = require('../utils/helpers');

const storefrontController = {
  async getHome(req, res, next) {
    try {
      const { store } = req;
      const storeId = store.id;

      const [featuredProducts, categories, trendingProducts, activeCoupons] = await Promise.all([
        prisma.product.findMany({
          where: { storeId, isActive: true },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          take: 8,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.category.findMany({
          where: { storeId, parentId: null, isActive: true },
          include: { children: { where: { isActive: true }, take: 5 }, _count: { select: { products: true } } },
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.product.findMany({
          where: { storeId, isActive: true },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { orderItems: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.coupon.findMany({
          where: {
            storeId,
            isActive: true,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      const theme = store.theme || {};
      const homepage = theme.homepage || {};
      const themeBanners = homepage.banners || [];
      
      // If banners array is empty, check if there are sections with type 'hero'
      let banners = themeBanners;
      if (banners.length === 0 && Array.isArray(homepage.sections)) {
        banners = homepage.sections
          .filter(s => s.type === 'hero' && s.isActive)
          .map(s => ({
            id: s.id,
            title: s.title,
            subtitle: s.content,
            imageUrl: s.imageUrl || store.banner,
            link: s.link || `/store/${store.slug}/products`,
            buttonText: s.buttonText || 'Shop Now'
          }));
      }

      if (banners.length === 0 && store.banner) {
        banners = [{
          id: 'default',
          title: `Welcome to ${store.name}`,
          subtitle: store.description,
          imageUrl: store.banner,
          link: `/store/${store.slug}/products`,
          buttonText: 'Shop Now'
        }];
      }

      const activeOffers = activeCoupons.map(c => ({
        id: c.id,
        code: c.code,
        title: c.description || `Save ${c.type === 'PERCENTAGE' ? c.value + '%' : '$' + c.value}`,
        description: c.description,
        discountType: c.type,
        discountValue: c.value,
        minOrderAmount: c.minOrderAmount,
        expiresAt: c.expiresAt,
      }));

      ApiResponse.success(res, {
        store: { name: store.name, logo: store.logo, theme: store.theme },
        banners,
        featuredProducts,
        categories,
        trendingProducts: trendingProducts.sort((a, b) => (b._count?.orderItems || 0) - (a._count?.orderItems || 0)),
        activeOffers,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProducts(req, res, next) {
    try {
      const storeId = req.store.id;
      const { search, categoryId, minPrice, maxPrice, sort, page, limit, inStock } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { storeId, isActive: true };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (categoryId) where.categoryId = categoryId;
      if (minPrice || maxPrice) {
        where.basePrice = {};
        if (minPrice) where.basePrice.gte = parseFloat(minPrice);
        if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
      }

      let orderBy = { createdAt: 'desc' };
      if (sort === 'price_asc') orderBy = { basePrice: 'asc' };
      else if (sort === 'price_desc') orderBy = { basePrice: 'desc' };
      else if (sort === 'name_asc') orderBy = { name: 'asc' };
      else if (sort === 'name_desc') orderBy = { name: 'desc' };
      else if (sort === 'popular') orderBy = { createdAt: 'desc' };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy,
          skip,
          take,
        }),
        prisma.product.count({ where }),
      ]);

      const pagination = getPaginationMeta(total, pageNum, limitNum);
      ApiResponse.paginated(res, products, pagination);
    } catch (error) {
      next(error);
    }
  },

  async getProduct(req, res, next) {
    try {
      const storeId = req.store.id;
      const { slug } = req.params;
      const product = await prisma.product.findFirst({
        where: { storeId, slug, isActive: true },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: { isActive: true } },
          category: true,
          reviews: {
            where: { isApproved: true },
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
      if (!product) throw new ApiError(404, 'Product not found');

      const rating = await prisma.review.aggregate({
        where: { productId: product.id, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const related = await prisma.product.findMany({
        where: {
          storeId,
          categoryId: product.categoryId,
          id: { not: product.id },
          isActive: true,
        },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        take: 4,
      });

      ApiResponse.success(res, {
        ...product,
        averageRating: rating._avg.rating || 0,
        reviewCount: rating._count.rating || 0,
        related,
      });
    } catch (error) {
      next(error);
    }
  },

  async getCategories(req, res, next) {
    try {
      const storeId = req.store.id;
      const categories = await prisma.category.findMany({
        where: { storeId, parentId: null, isActive: true },
        include: {
          children: {
            where: { isActive: true },
            include: { children: { where: { isActive: true } } },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });
      ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  },

  async getCategory(req, res, next) {
    try {
      const storeId = req.store.id;
      const { slug } = req.params;
      const category = await prisma.category.findFirst({
        where: { storeId, slug, isActive: true },
        include: { children: { where: { isActive: true } } },
      });
      if (!category) throw new ApiError(404, 'Category not found');

      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(req.query.page, req.query.limit);
      const where = { storeId, categoryId: category.id, isActive: true };
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { images: { where: { isPrimary: true }, take: 1 } },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.product.count({ where }),
      ]);

      ApiResponse.success(res, {
        category,
        products,
        pagination: getPaginationMeta(total, pageNum, limitNum),
      });
    } catch (error) {
      next(error);
    }
  },

  async search(req, res, next) {
    try {
      const storeId = req.store.id;
      const { q, page, limit } = req.query;
      if (!q) throw new ApiError(400, 'Search query is required');

      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);
      const where = {
        storeId,
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
        ],
      };

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { images: { where: { isPrimary: true }, take: 1 } },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.product.count({ where }),
      ]);

      ApiResponse.paginated(res, products, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async addToCart(req, res, next) {
    try {
      const storeId = req.store.id;
      const { productId, variantId, quantity = 1 } = req.body;
      const userId = req.user.id;

      if (!productId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
        throw new ApiError(400, 'Invalid product ID');
      }

      if (variantId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantId)) {
        throw new ApiError(400, 'Invalid variant ID');
      }

      const product = await prisma.product.findFirst({
        where: { id: productId, storeId, isActive: true },
      });
      if (!product) throw new ApiError(404, 'Product not found');

      const existingItem = await prisma.cartItem.findFirst({
        where: { userId, productId, variantId: variantId || null },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        let price = product.basePrice;
        if (variantId) {
          const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
          if (variant) price = variant.price;
        }
        
        await prisma.cartItem.create({
          data: { userId, productId, variantId: variantId || null, quantity, price },
        });
      }
      ApiResponse.success(res, null, 'Added to cart');
    } catch (error) {
      console.error('addToCart Error:', error);
      next(error);
    }
  },

  async updateCartItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');

      const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
      if (!item || item.userId !== req.user.id) throw new ApiError(404, 'Cart item not found');

      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
      ApiResponse.success(res, null, 'Cart updated');
    } catch (error) {
      next(error);
    }
  },

  async removeCartItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
      if (!item || item.userId !== req.user.id) throw new ApiError(404, 'Cart item not found');

      await prisma.cartItem.delete({ where: { id: itemId } });
      ApiResponse.success(res, null, 'Item removed from cart');
    } catch (error) {
      next(error);
    }
  },

  async getCart(req, res, next) {
    try {
      const storeId = req.store.id;
      const userId = req.user.id;

      const items = await prisma.cartItem.findMany({
        where: { userId, product: { storeId } },
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      });

      const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
      ApiResponse.success(res, { items, subtotal, total: subtotal });
    } catch (error) {
      next(error);
    }
  },

  async addToWishlist(req, res, next) {
    try {
      const { productId } = req.body;
      const userId = req.user.id;

      const existing = await prisma.wishlistItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      if (existing) throw new ApiError(409, 'Product already in wishlist');

      await prisma.wishlistItem.create({ data: { userId, productId } });
      ApiResponse.created(res, null, 'Added to wishlist');
    } catch (error) {
      next(error);
    }
  },

  async removeWishlist(req, res, next) {
    try {
      const { productId } = req.params;
      const userId = req.user.id;
      await prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
      ApiResponse.success(res, null, 'Removed from wishlist');
    } catch (error) {
      next(error);
    }
  },

  async getWishlist(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { userId };
      const [items, total] = await Promise.all([
        prisma.wishlistItem.findMany({
          where,
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.wishlistItem.count({ where }),
      ]);

      ApiResponse.paginated(res, items, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async createOrder(req, res, next) {
    try {
      const storeId = req.store.id;
      const userId = req.user.id;
      const { shippingAddressId, billingAddressId, notes, couponCode } = req.body;

      const cartItems = await prisma.cartItem.findMany({
        where: { userId, product: { storeId } },
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      });
      if (!cartItems.length) throw new ApiError(400, 'Cart is empty');

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: { settings: true },
      });
      if (!store) throw new ApiError(404, 'Store not found');

      const shippingAddress = shippingAddressId
        ? await prisma.address.findFirst({ where: { id: shippingAddressId, userId } })
        : null;

      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        sku: item.product.sku,
        price: item.price || item.product.basePrice,
        quantity: item.quantity,
        image: item.product.images?.[0]?.url || null,
        total: Number(item.price || item.product.basePrice) * item.quantity,
      }));

      const subtotal = orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      let discount = 0;
      let couponId = null;
      if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
          where: { code: couponCode, storeId, isActive: true, expiresAt: { gte: new Date() } },
        });
        if (coupon) {
          couponId = coupon.id;
          discount = coupon.type === 'PERCENTAGE'
            ? (subtotal * Number(coupon.value)) / 100
            : Math.min(Number(coupon.value), subtotal);
        }
      }

      const taxAmount = Number(store.settings?.taxRate || 0) > 0
        ? (subtotal - discount) * (Number(store.settings.taxRate) / 100)
        : 0;

      const total = subtotal - discount + taxAmount;
      const orderPrefix = store.settings?.orderPrefix || 'ORD';
      const orderNumber = generateOrderNumber(orderPrefix);

      // Find or create customer record for this user+store
      let customer = await prisma.customer.findFirst({
        where: { storeId, userId },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            storeId,
            userId,
            email: req.user.email,
            firstName: req.user.firstName || '',
            lastName: req.user.lastName || '',
            phone: req.user.phone || null,
          },
        });
      }

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          customerId: customer.id,
          storeId,
          subtotal,
          discountAmount: discount,
          shippingAmount: 0,
          taxAmount,
          total,
          status: 'PENDING',
          notes,
          shippingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          billingAddress: billingAddressId
            ? JSON.parse(JSON.stringify(await prisma.address.findFirst({ where: { id: billingAddressId, userId } })))
            : shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          orderItems: { create: orderItems },
        },
        include: { orderItems: true },
      });

      await prisma.cartItem.deleteMany({ where: { userId, product: { storeId } } });

      // Update customer stats
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
        },
      });

      ApiResponse.created(res, order, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  },

  async getOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, page, limit } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { userId };
      if (status) where.status = status;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { orderItems: true, store: { select: { id: true, name: true, logo: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.order.count({ where }),
      ]);

      ApiResponse.paginated(res, orders, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          orderItems: true,
          store: { select: { id: true, name: true, logo: true, email: true, phone: true } },
          payment: true,
          shipping: true,
        },
      });
      if (!order || order.userId !== req.user.id) throw new ApiError(404, 'Order not found');

      ApiResponse.success(res, order);
    } catch (error) {
      next(error);
    }
  },

  async getAddresses(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        throw new ApiError(401, 'Authentication required');
      }
      const addresses = await prisma.address.findMany({
        where: { userId: req.user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      ApiResponse.success(res, addresses);
    } catch (error) {
      console.error('getAddresses Error:', error);
      next(error);
    }
  },

  async createAddress(req, res, next) {
    try {
      const data = { ...req.body, userId: req.user.id };
      if (data.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user.id },
          data: { isDefault: false },
        });
      }
      const address = await prisma.address.create({ data });
      ApiResponse.created(res, address, 'Address created');
    } catch (error) {
      next(error);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
      if (!address) throw new ApiError(404, 'Address not found');

      if (req.body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: req.user.id, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.address.update({ where: { id }, data: req.body });
      ApiResponse.success(res, updated, 'Address updated');
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
      if (!address) throw new ApiError(404, 'Address not found');

      await prisma.address.delete({ where: { id } });
      ApiResponse.success(res, null, 'Address deleted');
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { role: true },
      });
      if (!user) throw new ApiError(404, 'User not found');
      ApiResponse.success(res, sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone, avatar } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone, avatar },
        include: { role: true },
      });
      ApiResponse.success(res, sanitizeUser(user), 'Profile updated');
    } catch (error) {
      next(error);
    }
  },

  async getCMSPage(req, res, next) {
    try {
      const storeId = req.store.id;
      const { slug } = req.params;

      const page = await prisma.cMSPage.findFirst({
        where: { storeId, slug, isActive: true },
      });

      if (!page) throw new ApiError(404, 'Page not found');

      ApiResponse.success(res, {
        ...page,
        content: typeof page.content === 'string' ? page.content : (page.content?.text || ''),
        isPublished: page.isActive,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = storefrontController;
