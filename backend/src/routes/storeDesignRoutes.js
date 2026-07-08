const express = require('express');
const router = express.Router();
const storeDesignController = require('../controllers/storeDesignController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('STORE_OWNER', 'STORE_STAFF'));

router.get('/theme', storeDesignController.getTheme);
router.put('/theme', storeDesignController.updateTheme);

router.get('/homepage', storeDesignController.getHomepage);
router.put('/homepage', storeDesignController.updateHomepage);

router.get('/header', storeDesignController.getHeader);
router.put('/header', storeDesignController.updateHeader);

router.get('/footer', storeDesignController.getFooter);
router.put('/footer', storeDesignController.updateFooter);

router.get('/menus', storeDesignController.getMenus);
router.put('/menus', storeDesignController.updateMenus);

router.get('/page-layouts', storeDesignController.getPageLayouts);
router.put('/page-layouts/:pageType', storeDesignController.updatePageLayout);

module.exports = router;
