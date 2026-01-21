const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  sendMessage,
  getMessages,
  markMessagesRead,
} = require("../controllers/message.controller");

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/read/:chatId", protect, markMessagesRead);

module.exports = router;
