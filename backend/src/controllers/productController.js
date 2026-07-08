const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { calculatePagination, getPaginationMeta, generateSlug, generateSKU, generateBarcode } = require('../utils/helpers');
const { ApiError } = require('../middleware/errorHandler');

const productController = {
  async getProducts(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user?.ownedStore?.id || req.query.storeId;
      
      if (!storeId) {
        return ApiResponse.paginated(res, [], getPaginationMeta(0, 1, 15));
      }
      const { page, limit, search, categoryId, brandId, status, minPrice, maxPrice, sortBy, sortOrder } = req.query;
      const { skip, take, page: pageNum, limit: limitNum } = calculatePagination(page, limit);

      const where = { storeId, deletedAt: null };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (categoryId) where.categoryId = categoryId;
      if (brandId) where.brandId = brandId;
      if (status === 'active') where.isActive = true;
      else if (status === 'inactive') where.isActive = false;
      if (minPrice || maxPrice) {
        where.basePrice = {};
        if (minPrice) where.basePrice.gte = parseFloat(minPrice);
        if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
      }

      const orderBy = {};
      if (sortBy) {
        orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
            images: { where: { isPrimary: true }, take: 1 },
            variants: { where: { deletedAt: null, isActive: true }, select: { id: true, name: true, price: true, stock: true } },
            inventory: { select: { quantity: true, available: true } },
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
      const { id } = req.params;
      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
        include: {
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          inventory: { include: { warehouse: { select: { id: true, name: true } } } },
        },
      });

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  },

  async createProduct(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user?.ownedStore?.id;
      if (!storeId) {
        throw new ApiError(400, 'Please create a store before adding products.');
      }
      const {
        name, description, shortDescription, basePrice, comparePrice, costPrice,
        categoryId, brandId, tags, sku, barcode, weight, weightUnit,
        trackQuantity, isActive, isFeatured, isPhysical,
        images, variants,
      } = req.body;

      const slug = generateSlug(name);
      const productSku = sku || generateSKU('PRD', 'GEN', Date.now().toString(36).toUpperCase());
      const productBarcode = barcode || generateBarcode();

      const product = await prisma.product.create({
        data: {
          storeId,
          name,
          slug,
          description,
          shortDescription,
          basePrice: parseFloat(basePrice),
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          costPrice: costPrice ? parseFloat(costPrice) : null,
          categoryId: categoryId || null,
          brandId: brandId || null,
          tags: tags || [],
          sku: productSku,
          barcode: productBarcode,
          weight: weight ? parseFloat(weight) : null,
          weightUnit: weightUnit || 'kg',
          trackQuantity: trackQuantity !== false,
          isActive: isActive !== false,
          isFeatured: isFeatured || false,
          isPhysical: isPhysical !== false,
          images: images?.length ? {
            create: images.map((img, i) => ({
              url: img.url,
              altText: img.altText || name,
              isPrimary: img.isPrimary || i === 0,
              sortOrder: img.sortOrder || i,
            })),
          } : undefined,
          variants: variants?.length ? {
            create: variants.map((v, i) => ({
              name: v.name,
              sku: v.sku || `${productSku}-${i + 1}`,
              barcode: v.barcode || generateBarcode(),
              price: parseFloat(v.price),
              comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
              costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
              weight: v.weight ? parseFloat(v.weight) : null,
              options: v.options || {},
              stock: v.stock || 0,
              sortOrder: v.sortOrder || i,
            })),
          } : undefined,
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: { deletedAt: null } },
        },
      });

      ApiResponse.created(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.params.storeId || req.user?.ownedStore?.id;
      if (!storeId) {
        throw new ApiError(400, 'Store ID is required.');
      }
      const {
        name, description, shortDescription, basePrice, comparePrice, costPrice,
        categoryId, brandId, tags, sku, barcode, weight, weightUnit,
        trackQuantity, isActive, isFeatured, isPhysical,
        images, variants,
      } = req.body;

      const existing = await prisma.product.findFirst({ where: { id, storeId, deletedAt: null } });
      if (!existing) {
        throw new ApiError(404, 'Product not found');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (name !== undefined) updateData.slug = generateSlug(name);
      if (description !== undefined) updateData.description = description;
      if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
      if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice);
      if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
      if (costPrice !== undefined) updateData.costPrice = costPrice ? parseFloat(costPrice) : null;
      if (categoryId !== undefined) updateData.categoryId = categoryId || null;
      if (brandId !== undefined) updateData.brandId = brandId || null;
      if (tags !== undefined) updateData.tags = tags;
      if (sku !== undefined) updateData.sku = sku;
      if (barcode !== undefined) updateData.barcode = barcode;
      if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
      if (weightUnit !== undefined) updateData.weightUnit = weightUnit;
      if (trackQuantity !== undefined) updateData.trackQuantity = trackQuantity;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (isPhysical !== undefined) updateData.isPhysical = isPhysical;

      const product = await prisma.$transaction(async (tx) => {
        if (images) {
          await tx.productImage.deleteMany({ where: { productId: id } });
          await tx.productImage.createMany({
            data: images.map((img, i) => ({
              productId: id,
              url: img.url,
              altText: img.altText || name || existing.name,
              isPrimary: img.isPrimary || i === 0,
              sortOrder: img.sortOrder || i,
            })),
          });
        }

        if (variants) {
          await tx.productVariant.deleteMany({ where: { productId: id } });
          if (variants.length) {
            await tx.productVariant.createMany({
              data: variants.map((v, i) => ({
                productId: id,
                name: v.name,
                sku: v.sku || `${sku || existing.sku}-${i + 1}`,
                barcode: v.barcode || generateBarcode(),
                price: parseFloat(v.price),
                comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
                costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
                weight: v.weight ? parseFloat(v.weight) : null,
                options: v.options || {},
                stock: v.stock || 0,
                sortOrder: v.sortOrder || i,
              })),
            });
          }
        }

        return tx.product.update({
          where: { id },
          data: updateData,
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
            inventory: true,
          },
        });
      });

      ApiResponse.success(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const storeId = req.params.storeId || req.user.ownedStore?.id;

      const product = await prisma.product.findFirst({ where: { id, storeId, deletedAt: null } });
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });

      ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async bulkUpload(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;
      const { products } = req.body;

      if (!products?.length) {
        throw new ApiError(400, 'Products array is required');
      }

      const created = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        try {
          const p = products[i];
          const slug = generateSlug(p.name);
          const productSku = p.sku || generateSKU('PRD', 'GEN', Date.now().toString(36).toUpperCase());

          const product = await prisma.product.create({
            data: {
              storeId,
              name: p.name,
              slug,
              description: p.description,
              shortDescription: p.shortDescription,
              basePrice: parseFloat(p.basePrice),
              comparePrice: p.comparePrice ? parseFloat(p.comparePrice) : null,
              costPrice: p.costPrice ? parseFloat(p.costPrice) : null,
              categoryId: p.categoryId || null,
              brandId: p.brandId || null,
              tags: p.tags || [],
              sku: productSku,
              barcode: p.barcode || generateBarcode(),
              weight: p.weight ? parseFloat(p.weight) : null,
              trackQuantity: p.trackQuantity !== false,
              isActive: p.isActive !== false,
            },
          });
          created.push(product);
        } catch (err) {
          errors.push({ index: i, error: err.message });
        }
      }

      ApiResponse.created(res, { created: created.length, failed: errors.length, products: created, errors },
        `Processed ${created.length} products with ${errors.length} errors`);
    } catch (error) {
      next(error);
    }
  },

  async getProductSEO(req, res, next) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, metaTitle: true, metaDescription: true, metaKeywords: true },
      });

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  },

  async updateProductSEO(req, res, next) {
    try {
      const { id } = req.params;
      const { metaTitle, metaDescription, metaKeywords } = req.body;

      const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
      if (!existing) {
        throw new ApiError(404, 'Product not found');
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
          metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
          metaKeywords: metaKeywords !== undefined ? metaKeywords : existing.metaKeywords,
        },
        select: { id: true, metaTitle: true, metaDescription: true, metaKeywords: true },
      });

      ApiResponse.success(res, product, 'SEO fields updated');
    } catch (error) {
      next(error);
    }
  },

  async getInventory(req, res, next) {
    try {
      const storeId = req.params.storeId || req.user.ownedStore?.id;
      const { productId } = req.params;

      const product = await prisma.product.findFirst({
        where: { id: productId, storeId, deletedAt: null },
        select: { id: true, name: true, sku: true, trackQuantity: true },
      });

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      const [inventory, variants] = await Promise.all([
        prisma.inventory.findMany({
          where: { productId },
          include: { warehouse: { select: { id: true, name: true } } },
        }),
        prisma.productVariant.findMany({
          where: { productId, deletedAt: null },
          select: { id: true, name: true, sku: true, stock: true },
        }),
      ]);

      ApiResponse.success(res, { product, inventory, variants });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productController;
