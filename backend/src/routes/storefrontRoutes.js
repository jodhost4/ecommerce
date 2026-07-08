const express = require('express');
const router = express.Router({ mergeParams: true });
const prisma = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');
const storefrontController = require('../controllers/storefrontController');
const { authenticate, optionalAuth } = require('../middleware/auth');

async function resolveStoreId(req, _res, next) {
  try {
    const { storeId } = req.params;
    if (!storeId) return next(new ApiError(400, 'Store ID is required'));

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
    
    const store = await prisma.store.findFirst({
      where: isUuid ? { id: storeId } : { slug: storeId },
      include: {
        theme: true,
        settings: true
      }
    });

    if (!store) return next(new ApiError(404, 'Store not found'));

    req.store = store;
    req.params.storeId = store.id; // Ensure storeId param is always the UUID for controllers
    next();
  } catch (error) {
    next(error);
  }
}

router.use(resolveStoreId);

router.get('/home', storefrontController.getHome);
router.get('/products', storefrontController.getProducts);
router.get('/products/search', storefrontController.search);
router.get('/products/:slug', storefrontController.getProduct);
router.get('/categories', storefrontController.getCategories);
router.get('/categories/:slug', storefrontController.getCategory);

router.post('/cart', authenticate, storefrontController.addToCart);
router.get('/cart', authenticate, storefrontController.getCart);
router.put('/cart/items/:itemId', authenticate, storefrontController.updateCartItem);
router.delete('/cart/items/:itemId', authenticate, storefrontController.removeCartItem);

router.post('/wishlist', authenticate, storefrontController.addToWishlist);
router.get('/wishlist', authenticate, storefrontController.getWishlist);
router.delete('/wishlist/:productId', authenticate, storefrontController.removeWishlist);

router.post('/orders', authenticate, storefrontController.createOrder);
router.get('/orders', authenticate, storefrontController.getOrders);
router.get('/orders/:orderNumber', authenticate, storefrontController.getOrder);

router.get('/addresses', authenticate, storefrontController.getAddresses);
router.post('/addresses', authenticate, storefrontController.createAddress);
router.put('/addresses/:id', authenticate, storefrontController.updateAddress);
router.delete('/addresses/:id', authenticate, storefrontController.deleteAddress);

router.get('/profile', authenticate, storefrontController.getProfile);
router.put('/profile', authenticate, storefrontController.updateProfile);

router.get('/page/:slug', storefrontController.getCMSPage);

module.exports = router;
