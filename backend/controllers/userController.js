const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc  Search users by username (exclude self & existing friends)
 * @route GET /api/users/search?username=xyz
 * @access Private (must be logged in)
 */
const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Please provide a username to search' });
    }

    logger.info(`[Search Users API] User ${req.user.username} searching for: "${username}"`);

    // Case-insensitive partial match — like Instagram's search
    // Excludes: the logged-in user themselves + anyone already in their friends list
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user._id },              // exclude self
      _id: { $nin: req.user.friends },          // exclude already-friends
    }).select('name lastName username avatar isOnline');

    logger.info(`[Search Users API] Found ${users.length} result(s) for "${username}"`);

    res.status(200).json({ success: true, users });

  } catch (error) {
    logger.error(`[Search Users API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during user search' });
  }
};

module.exports = { searchUsers };
