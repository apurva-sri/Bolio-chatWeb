const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  sendMessage,
  getMessages,
  markMessagesRead,
  markDelivered,
} = require("../controllers/message.controller");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("file"), sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/read/:chatId", protect, markMessagesRead);
router.put("/delivered/:id", protect, markDelivered);
router.put("/delete/me/:messageId", protect, deleteForMe);
router.put("/delete/everyone/:messageId", protect, deleteForEveryone);

module.exports = router;
