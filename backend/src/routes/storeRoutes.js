const express = require('express');
const router = express.Router();
const { authenticate, authorize, storeAccess } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const storeController = require('../controllers/storeController');
const { createStoreSchema, updateStoreSchema, updateSettingsSchema, updateThemeSchema } = require('../validators/storeValidator');

router.get('/check-domain', storeController.checkDomain);

router.post('/', authenticate, authorize('STORE_OWNER'), validate(createStoreSchema), storeController.createStore);

router.get('/public-list', storeController.getPublicStores);
router.get('/', authenticate, authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'), storeController.getStores);

router.get('/:slug', authenticate, storeController.getStore);

router.put('/:id', authenticate, authorize('STORE_OWNER'), storeAccess, validate(updateStoreSchema), storeController.updateStore);

router.delete('/:id', authenticate, authorize('STORE_OWNER'), storeAccess, storeController.deleteStore);

router.get('/:id/settings', authenticate, storeAccess, storeController.getStoreSettings);

router.put('/:id/settings', authenticate, authorize('STORE_OWNER'), storeAccess, validate(updateSettingsSchema), storeController.updateStoreSettings);

router.get('/:id/theme', authenticate, storeAccess, storeController.getStoreTheme);

router.put('/:id/theme', authenticate, authorize('STORE_OWNER'), storeAccess, validate(updateThemeSchema), storeController.updateStoreTheme);

router.post('/:id/publish', authenticate, authorize('STORE_OWNER'), storeAccess, storeController.publishStore);

module.exports = router;
