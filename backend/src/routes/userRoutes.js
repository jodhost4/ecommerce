const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, userController.getUsers);
router.get('/:id', authenticate, userController.getUser);

module.exports = router;
