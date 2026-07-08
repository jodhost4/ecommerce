const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../middleware/errorHandler');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');

const cmsPageController = {
  async getPages(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const { page = 1, limit = 20, search } = req.query;
      const pagination = calculatePagination(page, limit);

      const where = { storeId };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [pages, total] = await Promise.all([
        prisma.cMSPage.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip: pagination.skip,
          take: pagination.take,

        }),
        prisma.cMSPage.count({ where }),
      ]);

      // Transform content from Json to string for frontend compatibility
      const transformedPages = pages.map((p) => ({
        ...p,
        content: typeof p.content === 'string' ? p.content : (p.content?.text || JSON.stringify(p.content) || ''),
        isPublished: p.isActive,
      }));

      ApiResponse.paginated(res, transformedPages, getPaginationMeta(total, pagination.page, pagination.limit));
    } catch (error) {
      next(error);
    }
  },

  async getPage(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;

      const page = await prisma.cMSPage.findFirst({
        where: { id, storeId },
      });

      if (!page) throw new ApiError(404, 'Page not found');

      ApiResponse.success(res, {
        ...page,
        content: typeof page.content === 'string' ? page.content : (page.content?.text || JSON.stringify(page.content) || ''),
        isPublished: page.isActive,
      });
    } catch (error) {
      next(error);
    }
  },

  async createPage(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const { title, slug, content, isPublished, metaTitle, metaDescription } = req.body;

      // Generate unique slug
      const baseSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let finalSlug = baseSlug;
      const existing = await prisma.cMSPage.findFirst({ where: { storeId, slug: baseSlug } });
      if (existing) {
        finalSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
      }

      const page = await prisma.cMSPage.create({
        data: {
          storeId,
          title,
          slug: finalSlug,
          content: { text: content || '' },
          isActive: isPublished !== undefined ? isPublished : true,
          metaTitle,
          metaDescription,
        },
      });

      ApiResponse.created(res, {
        ...page,
        content: page.content?.text || '',
        isPublished: page.isActive,
      }, 'Page created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updatePage(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;

      const existing = await prisma.cMSPage.findFirst({ where: { id, storeId } });
      if (!existing) throw new ApiError(404, 'Page not found');

      const { title, slug, content, isPublished, metaTitle, metaDescription } = req.body;
      const data = {};
      if (title !== undefined) data.title = title;
      if (slug !== undefined) data.slug = slug;
      if (content !== undefined) data.content = { text: content };
      if (isPublished !== undefined) data.isActive = isPublished;
      if (metaTitle !== undefined) data.metaTitle = metaTitle;
      if (metaDescription !== undefined) data.metaDescription = metaDescription;

      const page = await prisma.cMSPage.update({ where: { id }, data });

      ApiResponse.success(res, {
        ...page,
        content: page.content?.text || '',
        isPublished: page.isActive,
      }, 'Page updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deletePage(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.store?.id || req.user.ownedStore?.id;

      const existing = await prisma.cMSPage.findFirst({ where: { id, storeId } });
      if (!existing) throw new ApiError(404, 'Page not found');

      await prisma.cMSPage.delete({ where: { id } });
      ApiResponse.success(res, null, 'Page deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = cmsPageController;
