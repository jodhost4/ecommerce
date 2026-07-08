const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, notificationController.getNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.get('/preferences', authenticate, notificationController.getPreferences);
router.put('/preferences', authenticate, notificationController.updatePreferences);
router.post('/test', authenticate, notificationController.sendTestNotification);
router.post('/send', authenticate, authorize('SUPER_ADMIN', 'STORE_OWNER'), notificationController.createNotification);

module.exports = router;
