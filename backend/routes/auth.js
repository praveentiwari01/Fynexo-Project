const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateAvatar } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/avatar', authMiddleware, updateAvatar);

module.exports = router;
