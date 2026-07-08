const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF'));

router.get('/dashboard/stats', merchantController.getDashboardStats);
router.get('/dashboard/revenue-chart', merchantController.getRevenueChart);
router.get('/dashboard/recent-orders', merchantController.getRecentOrders);
router.get('/dashboard/top-products', merchantController.getTopProducts);
router.get('/dashboard/recent-customers', merchantController.getRecentCustomers);

module.exports = router;
