const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.get('/:id/orders', customerController.getCustomerOrders);
router.get('/:id/addresses', customerController.getCustomerAddresses);

module.exports = router;
