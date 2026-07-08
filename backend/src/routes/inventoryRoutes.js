const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/', inventoryController.getInventory);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/warehouses', inventoryController.getWarehouses);
router.post('/warehouses', inventoryController.createWarehouse);
router.put('/warehouses/:id', inventoryController.updateWarehouse);
router.delete('/warehouses/:id', inventoryController.deleteWarehouse);
router.get('/product/:productId', inventoryController.getProductInventory);
router.get('/product/:productId/history', inventoryController.getStockHistory);
router.put('/stock', inventoryController.updateStock);

module.exports = router;
