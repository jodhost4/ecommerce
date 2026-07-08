const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/zones', shippingController.getShippingZones);
router.post('/zones', shippingController.createShippingZone);
router.put('/zones/:id', shippingController.updateShippingZone);
router.delete('/zones/:id', shippingController.deleteShippingZone);
router.get('/zones/:zoneId/rates', shippingController.getShippingRates);
router.post('/zones/:zoneId/rates', shippingController.createShippingRate);
router.put('/rates/:id', shippingController.updateShippingRate);
router.delete('/rates/:id', shippingController.deleteShippingRate);
router.get('/orders/:orderId', shippingController.getOrderShipping);
router.put('/orders/:orderId/tracking', shippingController.updateTracking);

module.exports = router;
