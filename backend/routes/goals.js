const express = require('express');
const router = express.Router();
const { getAll, create, update, remove, removeAll } = require('../controllers/goalController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/all', removeAll);
router.delete('/:id', remove);

module.exports = router;
