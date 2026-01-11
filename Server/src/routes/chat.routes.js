const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  accessChat,
  fetchChats,
  createGroupChat,
} = require("../controllers/chat.controller");

router.post("/", protect, accessChat);
router.get("/", protect, fetchChats);
router.post("/group", protect, createGroupChat);

module.exports = router;
