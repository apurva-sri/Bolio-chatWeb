const express = require('express');
const router = express.Router();
const { registerUser, verifyOtp, loginUser, refreshAccessToken, logoutUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

module.exports = router;
