const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { generateSlug, calculatePagination, getPaginationMeta } = require('../utils/helpers');

const brandController = {
  async getBrands(req, res, next) {
    try {
      const { page = 1, limit = 20, search, isActive } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);
      const storeId = req.params.storeId || req.query.storeId || req.user?.ownedStore?.id;

      const where = {};
      if (storeId) where.storeId = storeId;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [brands, total] = await Promise.all([
        prisma.brand.findMany({
          where,
          include: { _count: { select: { products: true } } },
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

  async getBrand(req, res, next) {
    try {
      const { id } = req.params;
      const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
          _count: { select: { products: true } },
          products: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true, basePrice: true, images: { where: { isPrimary: true }, take: 1 } },
            take: 10,
          },
        },
      });

      if (!brand) throw new ApiError(404, 'Brand not found');
      ApiResponse.success(res, brand);
    } catch (error) {
      next(error);
    }
  },

  async createBrand(req, res, next) {
    try {
      const { name, description, logo, website, storeId } = req.body;
      const slug = generateSlug(name);

      const store = await prisma.store.findUnique({ where: { id: storeId } });
      if (!store) throw new ApiError(404, 'Store not found');

      const existing = await prisma.brand.findUnique({ where: { storeId_slug: { storeId, slug } } });
      if (existing) throw new ApiError(409, 'Brand with this name already exists in this store');

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

      const brand = await prisma.brand.findUnique({ where: { id } });
      if (!brand) throw new ApiError(404, 'Brand not found');

      const data = {};
      if (name !== undefined) {
        data.name = name;
        data.slug = generateSlug(name);
        const existing = await prisma.brand.findFirst({
          where: { storeId: brand.storeId, slug: data.slug, id: { not: id } },
        });
        if (existing) throw new ApiError(409, 'Brand with this name already exists');
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
};

module.exports = brandController;
