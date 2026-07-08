const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize, storeAccess } = require('../middleware/auth');

// Public routes
router.get('/', reviewController.getReviews);
router.get('/:id', reviewController.getReview);

// Authenticated routes
router.post('/', authenticate, reviewController.createReview);
router.put('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);
router.put('/:id/moderate', authenticate, authorize('SUPER_ADMIN', 'STORE_OWNER'), reviewController.moderateReview);

// Store-scoped merchant summary (requires storeAccess)
router.get('/merchant/summary', authenticate, authorize('STORE_OWNER', 'STORE_STAFF', 'SUPER_ADMIN'), storeAccess, reviewController.getSummary);

module.exports = router;
