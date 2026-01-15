const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  sendMessage,
  getMessages,
} = require("../controllers/message.controller");

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);

module.exports = router;
