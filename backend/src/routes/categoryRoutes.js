const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, categoryController.getCategories);
router.get('/tree', optionalAuth, categoryController.getCategoryTree);
router.get('/:id', categoryController.getCategory);
router.post('/', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('STORE_OWNER', 'STORE_STAFF'), categoryController.deleteCategory);

module.exports = router;
