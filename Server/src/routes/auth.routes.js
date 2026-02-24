const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateProfile,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken); // get new access token
router.post("/logout", logoutUser); // revoke refresh token
router.get("/me", protect, getMe);
router.put("/profile", protect, upload.single("avatar"), updateProfile);

module.exports = router;
