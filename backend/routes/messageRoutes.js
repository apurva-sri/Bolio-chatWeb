const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send',        protect, sendMessage);
router.get('/:chatId',      protect, getMessages);
router.put('/:chatId/read', protect, markAsRead);

module.exports = router;
