const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { sanitizeUser, calculatePagination, getPaginationMeta } = require('../utils/helpers');

const userController = {
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, search, role, isActive } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { deletedAt: null };
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (role) where.role = { name: role };
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const storeId = req.user.role?.name === 'STORE_OWNER'
        ? (await prisma.store.findUnique({ where: { ownerId: req.user.id }, select: { id: true } }))?.id
        : null;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { role: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.user.count({ where }),
      ]);

      ApiResponse.paginated(res, users.map(sanitizeUser), getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: { role: { select: { id: true, name: true } } },
      });
      if (!user) throw new ApiError(404, 'User not found');
      ApiResponse.success(res, sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
