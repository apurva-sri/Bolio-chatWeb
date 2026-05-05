const Chat = require('../models/Chat');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc  Find existing chat OR create a new One-to-One chat between two friends
 * @route POST /api/chats/access
 * @access Private
 * body: { friendId }
*/
const accessChat = async (req, res) => {
  try {
    const { friendId, userId } = req.body;
    const targetId = friendId || userId;
    const currentUserId = req.user._id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Please provide a userId or friendId' });
    }

    logger.info(`[Access Chat API] ${req.user.username} trying to open chat with userId: ${targetId}`);

    const isFriend = req.user.friends.some(
      (id) => id.toString() === targetId.toString()
    );

    if (!isFriend) {
      logger.warn(`[Access Chat API] ${req.user.username} tried to chat with non-friend: ${targetId}`);
      return res.status(403).json({ success: false, message: 'You can only chat with your friends' });
    }

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [currentUserId, targetId] },
    })
      .populate('users', 'name lastName username avatar isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name username avatar' },
      });

    if (chat) {
      logger.info(`[Access Chat API] Existing chat found: ${chat._id}`);
      return res.status(200).json({ success: true, chat });
    }

    // No existing chat found — create a new one
    const friendUser = await User.findById(targetId).select('name username');

    const newChat = await Chat.create({
      chatName: `${req.user.username}_${friendUser.username}`,
      isGroupChat: false,
      users: [currentUserId, targetId],
    });

    // Re-fetch the created chat with populated user details
    const populatedChat = await Chat.findById(newChat._id).populate(
      'users',
      'name lastName username avatar isOnline lastSeen'
    );

    logger.success(`[Access Chat API] New chat created: ${newChat._id} between ${req.user.username} & ${friendUser.username}`);

    res.status(201).json({ success: true, chat: populatedChat });

  } catch (error) {
    logger.error(`[Access Chat API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while accessing chat' });
  }
};

/**
 * @desc  Get all chats for the logged-in user (for sidebar list)
 * @route GET /api/chats
 * @access Private
 */
const getAllChats = async (req, res) => {
  try {
    logger.info(`[Get All Chats API] Fetching chats for ${req.user.username}`);

    // Find all chats the current user is part of, sorted by latest activity
    const chats = await Chat.find({ users: { $in: [req.user._id] } })
      .populate('users', 'name lastName username avatar isOnline lastSeen')
      .populate({
        path: 'latestMessage',
        populate: { path: 'sender', select: 'name username avatar' },
      })
      .sort({ updatedAt: -1 }); // Most recently active chat first

    logger.info(`[Get All Chats API] Found ${chats.length} chat(s) for ${req.user.username}`);

    res.status(200).json({ success: true, chats });

  } catch (error) {
    logger.error(`[Get All Chats API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching chats' });
  }
};

module.exports = { accessChat, getAllChats };
