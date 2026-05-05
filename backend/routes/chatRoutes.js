const express = require('express');
const router = express.Router();
const { accessChat, getAllChats } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, accessChat);
router.get('/',        protect, getAllChats);

module.exports = router;
