const express = require('express');
const router = express.Router();
const cmsPageController = require('../controllers/cmsPageController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'));
router.use(storeAccess);

router.get('/', cmsPageController.getPages);
router.get('/:id', cmsPageController.getPage);
router.post('/', cmsPageController.createPage);
router.put('/:id', cmsPageController.updatePage);
router.delete('/:id', cmsPageController.deletePage);

module.exports = router;
