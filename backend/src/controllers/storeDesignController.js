const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');

const getTargetStoreId = async (req) => {
  if (req.store?.id) return req.store.id;
  if (req.user?.ownedStore?.id) return req.user.ownedStore.id;
  
  // Check if staff
  const staff = await prisma.storeStaff.findFirst({
    where: { userId: req.user.id },
    select: { storeId: true }
  });
  if (staff) return staff.storeId;
  
  throw new ApiError(400, 'Store context not found. Please ensure you are logged in as a store owner or staff.');
};

const storeDesignController = {
  async getTheme(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId },
      });
      ApiResponse.success(res, theme);
    } catch (error) {
      console.error('getTheme Error:', error);
      next(error);
    }
  },

  async updateTheme(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const themeData = req.body;

      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: themeData,
        create: {
          ...themeData,
          storeId,
          colors: themeData.colors || {},
          fonts: themeData.fonts || {},
          layout: themeData.layout || {},
        },
      });

      ApiResponse.success(res, theme);
    } catch (error) {
      console.error('updateTheme Error:', error);
      next(error);
    }
  },

  async getHomepage(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { homepage: true },
      });
      ApiResponse.success(res, theme?.homepage || {});
    } catch (error) {
      next(error);
    }
  },

  async updateHomepage(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.update({
        where: { storeId },
        data: { homepage: req.body },
      });
      ApiResponse.success(res, theme.homepage);
    } catch (error) {
      next(error);
    }
  },

  async getHeader(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { header: true },
      });
      ApiResponse.success(res, theme?.header || {});
    } catch (error) {
      next(error);
    }
  },

  async updateHeader(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.update({
        where: { storeId },
        data: { header: req.body },
      });
      ApiResponse.success(res, theme.header);
    } catch (error) {
      next(error);
    }
  },

  async getFooter(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { footer: true },
      });
      ApiResponse.success(res, theme?.footer || {});
    } catch (error) {
      next(error);
    }
  },

  async updateFooter(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.update({
        where: { storeId },
        data: { footer: req.body },
      });
      ApiResponse.success(res, theme.footer);
    } catch (error) {
      next(error);
    }
  },

  async getMenus(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { menus: true },
      });
      ApiResponse.success(res, theme?.menus || []);
    } catch (error) {
      next(error);
    }
  },

  async updateMenus(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.update({
        where: { storeId },
        data: { menus: req.body },
      });
      ApiResponse.success(res, theme.menus);
    } catch (error) {
      next(error);
    }
  },

  async getPageLayouts(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const theme = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { pageLayouts: true },
      });
      ApiResponse.success(res, theme?.pageLayouts || {});
    } catch (error) {
      next(error);
    }
  },

  async updatePageLayout(req, res, next) {
    try {
      const storeId = await getTargetStoreId(req);
      const { pageType } = req.params;

      const validTypes = ['shop', 'product-detail', 'cart', 'checkout', 'wishlist', 'categories'];
      if (!validTypes.includes(pageType)) {
        throw new ApiError(400, `Invalid page type. Must be one of: ${validTypes.join(', ')}`);
      }

      const existing = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { pageLayouts: true },
      });

      const pageLayouts = existing?.pageLayouts || {};
      pageLayouts[pageType] = req.body;

      const theme = await prisma.storeTheme.update({
        where: { storeId },
        data: { pageLayouts },
      });

      ApiResponse.success(res, theme.pageLayouts, `${pageType} layout updated`);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = storeDesignController;
