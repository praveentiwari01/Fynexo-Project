const express = require('express');
const router = express.Router();
const { getAll, create, remove, removeAll } = require('../controllers/investmentController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.post('/', create);
router.delete('/all', removeAll);
router.delete('/:id', remove);

module.exports = router;
