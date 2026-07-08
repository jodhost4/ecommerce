const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, brandController.getBrands);
router.get('/:id', brandController.getBrand);
router.post('/', authenticate, authorize('STORE_OWNER', 'SUPER_ADMIN'), brandController.createBrand);
router.put('/:id', authenticate, authorize('STORE_OWNER', 'SUPER_ADMIN'), brandController.updateBrand);
router.delete('/:id', authenticate, authorize('STORE_OWNER', 'SUPER_ADMIN'), brandController.deleteBrand);

module.exports = router;
