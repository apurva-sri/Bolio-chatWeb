const express = require("express");
const router = express.Router();
const { searchUsers } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, searchUsers);

module.exports = router;
