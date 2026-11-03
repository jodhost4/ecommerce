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

// Verify requesting user owns (or has access to) the resolved storeId
const verifyStoreAccess = async (req, storeId) => {
  const userRole = req.user?.role?.name;
  if (userRole === 'SUPER_ADMIN') return; // Super admins can edit any store

  // Check direct ownership
  if (req.user?.ownedStore?.id === storeId) return;

  // Check via DB
  const owned = await prisma.store.findFirst({
    where: { id: storeId, ownerId: req.user.id },
    select: { id: true }
  });
  if (owned) return;

  // Check staff access
  const staff = await prisma.storeStaff.findFirst({
    where: { storeId, userId: req.user.id, isActive: true },
    select: { storeId: true }
  });
  if (staff) return;

  throw new ApiError(403, 'You do not have permission to modify this store\'s design settings.');
};

const safeObject = (val) => {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  return val;
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
      await verifyStoreAccess(req, storeId);

      const themeData = req.body;
      const colors = safeObject(themeData.colors);
      const fonts = safeObject(themeData.fonts);
      const layout = safeObject(themeData.layout);

      if (colors.primary && !/^#[0-9a-fA-F]{6}$/.test(colors.primary)) {
        throw new ApiError(400, 'Invalid primary color format. Use hex (e.g., #ff0000)');
      }

      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: {
          colors,
          fonts,
          layout,
          header: themeData.header !== undefined ? safeObject(themeData.header) : undefined,
          footer: themeData.footer !== undefined ? safeObject(themeData.footer) : undefined,
          homepage: themeData.homepage !== undefined ? safeObject(themeData.homepage) : undefined,
          menus: themeData.menus !== undefined ? themeData.menus : undefined,
          pageLayouts: themeData.pageLayouts !== undefined ? safeObject(themeData.pageLayouts) : undefined,
          customCSS: themeData.customCSS !== undefined ? themeData.customCSS : undefined,
          name: themeData.name || 'Custom',
        },
        create: {
          name: themeData.name || 'Custom',
          storeId,
          colors,
          fonts,
          layout,
          header: safeObject(themeData.header),
          footer: safeObject(themeData.footer),
          homepage: safeObject(themeData.homepage),
          menus: themeData.menus || {},
          pageLayouts: safeObject(themeData.pageLayouts),
          customCSS: themeData.customCSS || '',
        },
      });

      ApiResponse.success(res, theme);
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        console.error('updateTheme Error:', error);
        next(new ApiError(500, 'Failed to update theme. Please check your input and try again.'));
      }
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
      await verifyStoreAccess(req, storeId);
      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: { homepage: req.body },
        create: {
          storeId,
          name: 'Custom',
          colors: {},
          fonts: {},
          layout: {},
          homepage: req.body,
        },
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
      await verifyStoreAccess(req, storeId);
      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: { header: req.body },
        create: {
          storeId,
          name: 'Custom',
          colors: {},
          fonts: {},
          layout: {},
          header: req.body,
        },
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
      await verifyStoreAccess(req, storeId);
      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: { footer: req.body },
        create: {
          storeId,
          name: 'Custom',
          colors: {},
          fonts: {},
          layout: {},
          footer: req.body,
        },
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
      await verifyStoreAccess(req, storeId);
      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: { menus: req.body },
        create: {
          storeId,
          name: 'Custom',
          colors: {},
          fonts: {},
          layout: {},
          menus: req.body,
        },
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
      await verifyStoreAccess(req, storeId);
      const { pageType } = req.params;

      const validTypes = ['shop', 'product-detail', 'cart', 'checkout', 'wishlist', 'categories'];
      if (!validTypes.includes(pageType)) {
        throw new ApiError(400, `Invalid page type. Must be one of: ${validTypes.join(', ')}`);
      }

      const existing = await prisma.storeTheme.findUnique({
        where: { storeId },
        select: { pageLayouts: true },
      });

      const pageLayouts = safeObject(existing?.pageLayouts);
      pageLayouts[pageType] = req.body;

      const theme = await prisma.storeTheme.upsert({
        where: { storeId },
        update: { pageLayouts },
        create: {
          storeId,
          name: 'Custom',
          colors: {},
          fonts: {},
          layout: {},
          pageLayouts,
        },
      });

      ApiResponse.success(res, theme.pageLayouts, `${pageType} layout updated`);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = storeDesignController;
