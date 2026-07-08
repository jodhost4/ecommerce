const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const adminController = require('../controllers/adminController');

router.use(authenticate, authorize('SUPER_ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/stores', adminController.getStores);
router.get('/stores/:id', adminController.getStoreDetail);
router.put('/stores/:id/approve', adminController.approveStore);
router.put('/stores/:id/suspend', adminController.suspendStore);

router.get('/plans', adminController.getPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

router.get('/themes', adminController.getThemes);
router.put('/themes/activate', adminController.activateTheme);

router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

router.get('/payments', adminController.getPayments);
router.get('/payments/:id', adminController.getPaymentDetail);

router.get('/reports', adminController.getReports);

router.get('/coupons', adminController.getCoupons);

router.get('/notifications', adminController.getNotifications);

router.get('/merchants', adminController.getMerchants);
router.get('/merchants/:id', adminController.getMerchantDetail);
router.put('/merchants/:id/verify', adminController.verifyMerchant);
router.put('/merchants/:id/block', adminController.blockMerchant);
router.delete('/merchants/:id', adminController.deleteMerchant);

router.get('/brands', adminController.getAllBrands);
router.post('/brands', adminController.createBrand);
router.put('/brands/:id', adminController.updateBrand);
router.delete('/brands/:id', adminController.deleteBrand);

router.get('/subscriptions', adminController.getSubscriptions);
router.get('/subscriptions/:id', adminController.getSubscriptionDetail);

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
