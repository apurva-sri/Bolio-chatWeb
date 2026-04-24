const User = require('../models/User');
const logger = require('../config/logger');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    API 1: Register a new user & send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, lastName, username, email, password, dob, gender, country } = req.body;

    logger.info(`[Register API] Called for email: ${email}, username: ${username}`);

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      logger.warn(`[Register API] Failed: User with email ${email} or username ${username} already exists`);
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    const user = await User.create({
      name,
      lastName,
      username,
      email,
      password,
      dob,
      gender,
      country,
      otp,
      otpExpires,
      isVerified: false
    });

    const message = `Welcome to our Chat App! \n\nYour Account Verification OTP is: ${otp}\nIt will expire in 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'Chat App - Verification OTP',
      message,
    });

    logger.info(`[Register API] Success: User created and OTP sent to ${email}`);
    
    // Respond back to frontend to move to Screen 3 (OTP Input)
    res.status(201).json({
      success: true,
      message: 'User details saved. Please check your email for the OTP.',
      email: user.email
    });

  } catch (error) {
    logger.error(`[Register API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during registration' });
  }
};

/**
 * @desc    API 2: Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    logger.info(`[Verify OTP API] Called for email: ${email}`);

    // Find the unverified user
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`[Verify OTP API] Failed: User not found for email ${email}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      logger.info(`[Verify OTP API] Notice: User ${email} is already verified`);
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      logger.warn(`[Verify OTP API] Failed: Invalid or expired OTP for email ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark user as verified and clear the OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    logger.info(`[Verify OTP API] Success: User ${email} verified successfully`);

    res.status(200).json({ 
      success: true, 
      message: 'Account verified successfully. You can now login.' 
    });

  } catch (error) {
    logger.error(`[Verify OTP API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error during OTP verification' });
  }
};

module.exports = {
  registerUser,
  verifyOtp
};