const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createProductSchema, updateProductSchema, bulkUploadSchema, updateProductSEOSchema } = require('../validators/productValidator');

router.get('/', optionalAuth, productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), validate(createProductSchema), productController.createProduct);
router.put('/:id', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), productController.deleteProduct);
router.post('/bulk-upload', authenticate, authorize('STORE_OWNER'), validate(bulkUploadSchema), productController.bulkUpload);
router.get('/:id/seo', productController.getProductSEO);
router.put('/:id/seo', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), validate(updateProductSEOSchema), productController.updateProductSEO);
router.get('/:productId/inventory', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), productController.getInventory);

module.exports = router;
