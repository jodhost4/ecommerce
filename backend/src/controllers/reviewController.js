const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const ApiResponse = require('../utils/ApiResponse');
const { calculatePagination, getPaginationMeta } = require('../utils/helpers');


const reviewController = {
  async getSummary(req, res, next) {
    try {
      const storeId = req.store?.id || req.user.ownedStore?.id;
      if (!storeId) throw new ApiError(400, 'Store not found');

      const [total, approved, pending, ratingGroups] = await Promise.all([
        prisma.review.count({ where: { product: { storeId } } }),
        prisma.review.count({ where: { product: { storeId }, isApproved: true } }),
        prisma.review.count({ where: { product: { storeId }, isApproved: false } }),
        prisma.review.groupBy({
          by: ['rating'],
          where: { product: { storeId }, isApproved: true },
          _count: { rating: true },
          orderBy: { rating: 'desc' },
        }),
      ]);

      const allRatings = await prisma.review.aggregate({
        _avg: { rating: true },
        where: { product: { storeId }, isApproved: true },
      });

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratingGroups.forEach((g) => {
        distribution[g.rating] = g._count.rating;
      });

      ApiResponse.success(res, {
        total,
        approved,
        pending,
        rejected: 0,
        average: Number((allRatings._avg.rating || 0).toFixed(1)),
        distribution,
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviews(req, res, next) {
    try {
      const { page = 1, limit = 20, productId, status, rating, search } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);
      const storeId = req.store?.id || req.query.storeId || req.params.storeId;

      const where = {};
      if (storeId) where.product = { storeId };
      if (productId) where.productId = productId;
      if (status === 'approved' || status === 'APPROVED') where.isApproved = true;
      if (status === 'pending' || status === 'PENDING') where.isApproved = false;
      if (rating) where.rating = parseInt(rating);
      if (search) {
        where.OR = [
          { content: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.review.count({ where }),
      ]);

      const ratingSummary = await prisma.review.groupBy({
        by: ['rating'],
        where: { ...where, isApproved: true },
        _count: { rating: true },
      });

      // Normalize reviews to have a status string field
      const normalizedReviews = reviews.map((r) => ({
        ...r,
        status: r.isApproved ? 'APPROVED' : 'PENDING',
      }));

      ApiResponse.paginated(res, { reviews: normalizedReviews, ratingSummary }, getPaginationMeta(total, pageNum, limitNum));
    } catch (error) {
      next(error);
    }
  },

  async getReview(req, res, next) {
    try {
      const { id } = req.params;
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
        },
      });

      if (!review) throw new ApiError(404, 'Review not found');
      ApiResponse.success(res, review);
    } catch (error) {
      next(error);
    }
  },

  async createReview(req, res, next) {
    try {
      const { productId, rating, title, content, media } = req.body;
      const userId = req.user.id;

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new ApiError(404, 'Product not found');

      const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
      if (existing) throw new ApiError(409, 'You have already reviewed this product');

      if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5');

      const review = await prisma.review.create({
        data: { productId, userId, rating, title, content, media: media || [] },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      });

      ApiResponse.created(res, review, 'Review created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, title, content, media, isApproved } = req.body;

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new ApiError(404, 'Review not found');

      if (req.user.role?.name !== 'SUPER_ADMIN' && review.userId !== req.user.id) {
        throw new ApiError(403, 'Not authorized to update this review');
      }

      const data = {};
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5');
        data.rating = rating;
      }
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      if (media !== undefined) data.media = media;
      if (isApproved !== undefined && req.user.role?.name === 'SUPER_ADMIN') data.isApproved = isApproved;

      const updated = await prisma.review.update({ where: { id }, data });
      ApiResponse.success(res, updated, 'Review updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new ApiError(404, 'Review not found');

      if (req.user.role?.name !== 'SUPER_ADMIN' && review.userId !== req.user.id) {
        throw new ApiError(403, 'Not authorized to delete this review');
      }

      await prisma.review.delete({ where: { id } });
      ApiResponse.success(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async moderateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new ApiError(404, 'Review not found');

      const updated = await prisma.review.update({ where: { id }, data: { isApproved } });
      ApiResponse.success(res, updated, `Review ${isApproved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reviewController;
