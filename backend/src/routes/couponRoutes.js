const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/', couponController.getCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.post('/validate', couponController.validateCoupon);
router.get('/reports', couponController.getCouponReports);

module.exports = router;
