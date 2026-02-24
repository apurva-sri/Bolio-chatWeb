const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  searchUsers,
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  getIncomingRequests,
  savePushSubscription,
} = require("../controllers/user.controller");

router.get("/search", protect, searchUsers);
router.get("/requests", protect, getIncomingRequests);
router.post("/request/:userId", protect, sendRequest);
router.put("/request/:requestId/accept", protect, acceptRequest);
router.put("/request/:requestId/decline", protect, declineRequest);
router.delete("/request/:requestId", protect, cancelRequest);

// Web push subscription
router.post("/push-subscription", protect, savePushSubscription);

module.exports = router;
