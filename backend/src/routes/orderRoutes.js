const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.get('/:id/timeline', orderController.getOrderTimeline);
router.post('/:id/cancel', orderController.cancelOrder);
router.get('/:id/invoice', orderController.getOrderInvoice);

module.exports = router;
