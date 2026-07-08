const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/sales', reportController.getSalesReport);
router.get('/revenue', reportController.getRevenueReport);
router.get('/customers', reportController.getCustomerReport);
router.get('/products', reportController.getProductReport);
router.get('/inventory', reportController.getInventoryReport);
router.get('/orders', reportController.getOrderReport);
router.get('/export/:type/:format', reportController.exportReport);

module.exports = router;
