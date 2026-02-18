const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { logCall, getCallHistory } = require("../controllers/call.controller");

router.post("/", protect, logCall);
router.get("/", protect, getCallHistory);

module.exports = router;
