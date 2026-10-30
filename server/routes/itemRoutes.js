const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { optionalAuthMiddleware, authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// GET /api/items/stats (must precede /:id)
router.get('/stats', itemController.getItemStats);

// GET /api/items
router.get('/', itemController.getItems);

// GET /api/items/:id
router.get('/:id', itemController.getItemById);

// POST /api/items (allows authenticated or guest student reports)
router.post('/', optionalAuthMiddleware, upload.single('image'), itemController.createItem);

// PUT /api/items/:id
router.put('/:id', optionalAuthMiddleware, upload.single('image'), itemController.updateItem);

// PATCH /api/items/:id/status (update status: Lost, Found, Claim Pending, Returned / Recovered)
router.patch('/:id/status', itemController.updateItemStatus);

// POST /api/items/:id/claim (express interest / claim an item)
router.post('/:id/claim', itemController.claimItem);

// DELETE /api/items/:id
router.delete('/:id', optionalAuthMiddleware, itemController.deleteItem);

module.exports = router;
