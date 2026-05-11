const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead, uploadFile } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/send',        protect, sendMessage);
router.post('/upload',      protect, upload.single('file'), uploadFile);
router.get('/:chatId',      protect, getMessages);
router.put('/:chatId/read', protect, markAsRead);

module.exports = router;
