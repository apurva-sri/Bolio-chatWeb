const express = require('express');
const router = express.Router();
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getIncomingRequests,
  getFriendsList,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-request',   protect, sendFriendRequest);
router.post('/accept-request', protect, acceptFriendRequest);
router.post('/reject-request', protect, rejectFriendRequest);
router.get('/requests',        protect, getIncomingRequests);
router.get('/list',            protect, getFriendsList);

module.exports = router;
