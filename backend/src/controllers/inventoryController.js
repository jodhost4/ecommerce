const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const inventoryController = {
  async getInventory(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { warehouseId, lowStock, search, page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { product: { storeId } };
      if (warehouseId) where.warehouseId = warehouseId;
      if (lowStock === 'true') {
        where.AND = [
          { quantity: { gt: 0 } },
          { available: { lte: 10 } },
        ];
      }
      if (search) {
        where.product = {
          ...where.product,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      const [items, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          include: {
            product: { select: { id: true, name: true, sku: true, basePrice: true, images: { where: { isPrimary: true }, take: 1 } } },
            warehouse: { select: { id: true, name: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take,

        }),
        prisma.inventory.count({ where }),
      ]);

      ApiResponse.paginated(res, items, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getProductInventory(req, res, next) {
    try {
      const { productId } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const product = await prisma.product.findFirst({
        where: { id: productId, storeId },
        include: {
          variants: { where: { isActive: true }, select: { id: true, name: true, sku: true, options: true } },
          inventory: {
            include: {
              warehouse: { select: { id: true, name: true } },
              variant: { select: { id: true, name: true, sku: true } },
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!product) throw new ApiError(404, 'Product not found');

      ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  },

  async updateStock(req, res, next) {
    try {
      const { productId, variantId, warehouseId, action, quantity, reason } = req.body;
      const user = req.user;

      if (!['add', 'remove', 'set'].includes(action)) {
        throw new ApiError(400, 'Action must be add, remove, or set');
      }

      const inventory = await prisma.inventory.findUnique({
        where: { productId_variantId_warehouseId: { productId, variantId: variantId || null, warehouseId } },
      });

      if (!inventory) throw new ApiError(404, 'Inventory record not found');

      let newQuantity;
      switch (action) {
        case 'add':
          newQuantity = inventory.quantity + quantity;
          break;
        case 'remove':
          newQuantity = Math.max(0, inventory.quantity - quantity);
          break;
        case 'set':
          newQuantity = Math.max(0, quantity);
          break;
      }

      const change = newQuantity - inventory.quantity;

      const updated = await prisma.$transaction(async (tx) => {
        const updatedInv = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQuantity,
            reserved: action === 'set' ? Math.min(inventory.reserved, newQuantity) : inventory.reserved,
            available: newQuantity - (action === 'set' ? Math.min(inventory.reserved, newQuantity) : inventory.reserved),
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId,
            variantId: variantId || null,
            warehouseId,
            type: action.toUpperCase(),
            quantity: change,
            reference: 'manual_adjustment',
            notes: reason || `Stock ${action}d by ${Math.abs(change)}`,
            userId: user.id,
          },
        });

        return updatedInv;
      });

      ApiResponse.success(res, updated, 'Stock updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { page = 1, limit = 20 } = req.query;
      const pagination = calculatePagination(page, limit);

      const threshold = parseInt(req.query.threshold) || 10;
      const where = {
        product: { storeId },
        quantity: { gt: 0 },
        available: { lte: threshold },
      };

      const [items, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          include: {
            product: { select: { id: true, name: true, sku: true, basePrice: true, images: { where: { isPrimary: true }, take: 1 } } },
            warehouse: { select: { id: true, name: true } },
          },
          orderBy: { available: 'asc' },
          ...pagination,
        }),
        prisma.inventory.count({ where }),
      ]);

      ApiResponse.paginated(res, items, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getStockHistory(req, res, next) {
    try {
      const { productId } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { page = 1, limit = 30 } = req.query;
      const pagination = calculatePagination(page, limit);

      const product = await prisma.product.findFirst({ where: { id: productId, storeId } });
      if (!product) throw new ApiError(404, 'Product not found');

      const where = { productId };
      const [logs, total] = await Promise.all([
        prisma.inventoryLog.findMany({
          where,
          include: {
            warehouse: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          ...pagination,
        }),
        prisma.inventoryLog.count({ where }),
      ]);

      ApiResponse.paginated(res, logs, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async createWarehouse(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { name, address, city, state, country, zipCode } = req.body;

      const warehouse = await prisma.warehouse.create({
        data: { storeId, name, address, city, state, country, zipCode },
      });

      ApiResponse.created(res, warehouse, 'Warehouse created successfully');
    } catch (error) {
      next(error);
    }
  },

  async getWarehouses(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const warehouses = await prisma.warehouse.findMany({
        where: { storeId, deletedAt: null },
        include: { _count: { select: { inventory: true } } },
        orderBy: { name: 'asc' },
      });

      ApiResponse.success(res, warehouses);
    } catch (error) {
      next(error);
    }
  },

  async updateWarehouse(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');
      const { name, address, city, state, country, zipCode, isActive } = req.body;

      const warehouse = await prisma.warehouse.findFirst({ where: { id, storeId } });
      if (!warehouse) throw new ApiError(404, 'Warehouse not found');

      const updated = await prisma.warehouse.update({
        where: { id },
        data: { name, address, city, state, country, zipCode, isActive },
      });

      ApiResponse.success(res, updated, 'Warehouse updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteWarehouse(req, res, next) {
    try {
      const { id } = req.params;
      const { storeId } = req.store;

      const warehouse = await prisma.warehouse.findFirst({ where: { id, storeId } });
      if (!warehouse) throw new ApiError(404, 'Warehouse not found');

      await prisma.warehouse.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      ApiResponse.success(res, null, 'Warehouse deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = inventoryController;
