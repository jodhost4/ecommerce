const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { calculatePagination, getPaginationMeta, generateSlug } = require('../utils/helpers');
const { ApiError } = require('../middleware/errorHandler');

const categoryController = {
  async getCategories(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user?.ownedStore?.id || req.query.storeId;
      const { page, limit, search, isActive } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { storeId, deletedAt: null };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          include: {
            _count: { select: { products: true, children: true } },
            parent: { select: { id: true, name: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip,
          take,
        }),
        prisma.category.count({ where }),
      ]);

      const pagination = getPaginationMeta(total, pageNum, limitNum);
      ApiResponse.paginated(res, categories, pagination);
    } catch (error) {
      next(error);
    }
  },

  async getCategoryTree(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user?.ownedStore?.id || req.query.storeId;

      const allCategories = await prisma.category.findMany({
        where: { storeId, deletedAt: null },
        include: {
          _count: { select: { products: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      const buildTree = (parentId = null) =>
        allCategories
          .filter((c) => c.parentId === parentId)
          .map((c) => ({
            ...c,
            children: buildTree(c.id),
          }));

      const tree = buildTree(null);

      ApiResponse.success(res, tree);
    } catch (error) {
      next(error);
    }
  },

  async getCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findFirst({
        where: { id, deletedAt: null },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { deletedAt: null },
            select: { id: true, name: true, slug: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
      });

      if (!category) {
        throw new ApiError(404, 'Category not found');
      }

      ApiResponse.success(res, category);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user?.ownedStore?.id || req.body.storeId;
      const { name, description, image, banner, parentId, isActive, sortOrder, metaTitle, metaDescription, metaKeywords } = req.body;

      const slug = generateSlug(name);

      const existingSlug = await prisma.category.findUnique({
        where: { storeId_slug: { storeId, slug } },
      });
      if (existingSlug) {
        throw new ApiError(409, 'A category with this slug already exists');
      }

      if (parentId) {
        const parent = await prisma.category.findFirst({ where: { id: parentId, storeId, deletedAt: null } });
        if (!parent) {
          throw new ApiError(404, 'Parent category not found');
        }
      }

      const category = await prisma.category.create({
        data: {
          storeId,
          name,
          slug,
          description,
          image,
          banner,
          parentId: parentId || null,
          isActive: isActive !== false,
          sortOrder: sortOrder || 0,
          metaTitle,
          metaDescription,
          metaKeywords,
        },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
      });

      ApiResponse.created(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.params.storeId || req.user?.ownedStore?.id;

      const existing = await prisma.category.findFirst({ where: { id, storeId, deletedAt: null } });
      if (!existing) {
        throw new ApiError(404, 'Category not found');
      }

      const { name, description, image, banner, parentId, isActive, sortOrder, metaTitle, metaDescription, metaKeywords } = req.body;

      const updateData = {};
      if (name !== undefined) {
        updateData.name = name;
        const slug = generateSlug(name);
        const slugConflict = await prisma.category.findFirst({
          where: { storeId, slug, id: { not: id }, deletedAt: null },
        });
        if (slugConflict) {
          throw new ApiError(409, 'A category with this slug already exists');
        }
        updateData.slug = slug;
      }
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (banner !== undefined) updateData.banner = banner;
      if (parentId !== undefined) {
        if (parentId === id) {
          throw new ApiError(400, 'A category cannot be its own parent');
        }
        if (parentId) {
          const parent = await prisma.category.findFirst({ where: { id: parentId, storeId, deletedAt: null } });
          if (!parent) {
            throw new ApiError(404, 'Parent category not found');
          }
        }
        updateData.parentId = parentId || null;
      }
      if (isActive !== undefined) updateData.isActive = isActive;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
      if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
      });

      ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.params.storeId || req.user?.ownedStore?.id;
      const { reassignTo } = req.query;

      const category = await prisma.category.findFirst({
        where: { id, storeId, deletedAt: null },
        include: { _count: { select: { products: true } } },
      });

      if (!category) {
        throw new ApiError(404, 'Category not found');
      }

      await prisma.$transaction(async (tx) => {
        if (category._count.products > 0 && reassignTo) {
          const target = await tx.category.findFirst({ where: { id: reassignTo, storeId, deletedAt: null } });
          if (!target) {
            throw new ApiError(404, 'Target category for reassignment not found');
          }
          await tx.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: reassignTo },
          });
        } else if (category._count.products > 0) {
          await tx.product.updateMany({
            where: { categoryId: id },
            data: { categoryId: null },
          });
        }

        await tx.category.update({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        });

        await tx.category.updateMany({
          where: { parentId: id, deletedAt: null },
          data: { parentId: null },
        });
      });

      ApiResponse.success(res, {
        affectedProducts: category._count.products,
        reassignedTo: reassignTo || null,
      }, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = categoryController;
