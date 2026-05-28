const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateAvatar, deleteAccount } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/avatar', authMiddleware, updateAvatar);
router.delete('/account', authMiddleware, deleteAccount);

module.exports = router;
