const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);
router.post('/webhook/razorpay', paymentController.handleRazorpayWebhook);

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/', paymentController.getPayments);
router.get('/methods', paymentController.getPaymentMethods);
router.get('/:id', paymentController.getPayment);
router.post('/create-intent', paymentController.createPaymentIntent);
router.post('/create-razorpay-order', paymentController.createRazorpayOrder);
router.post('/confirm', paymentController.confirmPayment);
router.post('/:id/refund', paymentController.processRefund);
router.get('/:paymentId/transactions', paymentController.getTransactions);

module.exports = router;
