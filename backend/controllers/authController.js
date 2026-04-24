const User = require('../models/User');
const logger = require('../config/logger');
const sendEmail = require('../utils/sendEmail');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

/**
 * @desc    API 1: Register - Store data in Redis & send OTP (User NOT yet in DB)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, lastName, username, email, password, dob, gender, country } = req.body;
    logger.info(`[Register API] Called for email: ${email}, username: ${username}`);

    // Check if user already exists in MongoDB
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      logger.warn(`[Register API] Failed: email ${email} or username ${username} already exists in DB`);
      return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
    }

    // Also check if there is already a pending registration in Redis
    const pending = await redis.get(`otp:${email}`);
    if (pending) {
      logger.warn(`[Register API] Pending registration already exists for ${email}`);
      return res.status(400).json({ success: false, message: 'A verification OTP was already sent to this email. Please check your inbox.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store ALL registration data + OTP temporarily in Redis for 10 minutes (600 seconds)
    // User will only be created in MongoDB AFTER OTP is verified
    const registrationData = JSON.stringify({ name, lastName, username, email, password, dob, gender, country, otp });
    await redis.setex(`otp:${email}`, 600, registrationData);

    // Send OTP via Gmail
    const message = `Welcome to Chat App!\n\nYour Account Verification OTP is: ${otp}\nIt will expire in 10 minutes.`;
    await sendEmail({ email, subject: 'Chat App - Verify Your Account', message });

    logger.info(`[Register API] Success: OTP sent to ${email}. Pending data stored in Redis.`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email,
    });

  } catch (error) {
    logger.error(`[Register API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during registration' });
  }
};

/**
 * @desc    API 2: Verify OTP - Create User in MongoDB only if OTP matches
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    logger.info(`[Verify OTP API] Called for email: ${email}`);

    // Retrieve pending registration data from Redis
    const pendingData = await redis.get(`otp:${email}`);

    if (!pendingData) {
      logger.warn(`[Verify OTP API] Failed: No pending OTP found for ${email}. It may have expired.`);
      return res.status(400).json({ success: false, message: 'OTP has expired or was never sent. Please register again.' });
    }

    const { name, lastName, username, password, dob, gender, country, otp: storedOtp } = JSON.parse(pendingData);

    // Compare OTP entered by user with the one stored in Redis
    if (otp !== storedOtp) {
      logger.warn(`[Verify OTP API] Failed: Incorrect OTP for ${email}`);
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // OTP is correct! Now create the user in MongoDB
    const user = await User.create({
      name,
      lastName,
      username,
      email,
      password,
      dob,
      gender,
      country,
    });

    // Delete the pending Redis entry — cleanup
    await redis.del(`otp:${email}`);

    logger.info(`[Verify OTP API] Success: User ${email} verified and created in DB`);

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully! You can now login.',
    });

  } catch (error) {
    logger.error(`[Verify OTP API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during OTP verification' });
  }
};

/**
 * @desc    API 3: Login user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info(`[Login API] Called for email: ${email}`);

    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`[Login API] Failed: User not found for email ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (await user.matchPassword(password)) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token in MongoDB
      user.refreshToken = refreshToken;
      await user.save();

      logger.info(`[Login API] Success: User ${email} logged in`);

      res.status(200).json({
        success: true,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        accessToken,
        refreshToken,
      });
    } else {
      logger.warn(`[Login API] Failed: Invalid password for email ${email}`);
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    logger.error(`[Login API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during login' });
  }
};

/**
 * @desc    API 4: Generate new access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
      logger.warn(`[Refresh Token API] Failed: Invalid refresh token`);
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', (err) => {
      if (err) {
        logger.warn(`[Refresh Token API] Failed: Token expired for user ${user.email}`);
        return res.status(403).json({ success: false, message: 'Refresh token expired. Please login again.' });
      }
      const newAccessToken = generateAccessToken(user._id);
      logger.info(`[Refresh Token API] Success: New access token for user ${user.email}`);
      res.status(200).json({ success: true, accessToken: newAccessToken });
    });

  } catch (error) {
    logger.error(`[Refresh Token API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during token refresh' });
  }
};

/**
 * @desc    API 5: Logout - Clear refresh token from DB
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
      logger.info(`[Logout API] Success: User ${user.email} logged out`);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`[Logout API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during logout' });
  }
};

module.exports = { registerUser, verifyOtp, loginUser, refreshAccessToken, logoutUser };