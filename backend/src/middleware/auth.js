const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const prisma = require('../config/database');

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        ownedStore: {
          include: {
            settings: true,
            theme: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid token. User not found.');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Account is deactivated.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
};

const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role?.name || req.user.roleName;

    if (!roles.includes(userRole)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }

    next();
  };
};

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { ownedStore: true, role: true }
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_error) {
    // Silent fail for optional auth
  }
  next();
};

const storeAccess = async (req, _res, next) => {
  try {
    let storeId = req.params.storeId || req.query.storeId || req.body.storeId;

    // For STORE_OWNER: use their owned store if no explicit storeId
    if (!storeId && req.user?.ownedStore?.id) {
      storeId = req.user.ownedStore.id;
    }

    // If still no storeId, query by owner
    if (!storeId && req.user?.role?.name === 'STORE_OWNER') {
      const ownedStore = await prisma.store.findUnique({
        where: { ownerId: req.user.id },
        select: { id: true }
      });
      if (ownedStore) {
        storeId = ownedStore.id;
      }
    }

    if (!storeId) {
      throw new ApiError(400, 'Store ID is required');
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
    const store = isUuid
      ? await prisma.store.findUnique({ where: { id: storeId } })
      : await prisma.store.findUnique({ where: { slug: storeId } });

    if (!store) {
      throw new ApiError(404, 'Store not found');
    }

    if (
      req.user.role.name !== 'SUPER_ADMIN' &&
      store.ownerId !== req.user.id &&
      !req.user.storeIds?.includes(store.id)
    ) {
      throw new ApiError(403, 'You do not have access to this store');
    }

    req.store = store;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, authorize, optionalAuth, storeAccess };
