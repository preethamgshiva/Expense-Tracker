const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateCategories } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/categories', protect, updateCategories);

module.exports = router;
