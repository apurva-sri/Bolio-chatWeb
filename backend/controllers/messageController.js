const Message = require('../models/Message');
const Chat = require('../models/Chat');
const logger = require('../config/logger');

/**
 * @desc  Send a message in a chat (text / image / file)
 * @route POST /api/messages/send
 * @access Private
 * body: { chatId, content, messageType ('text'|'image'|'file'), fileUrl }
 *
 * FLOW:
 * 1. Verify the chat exists and the sender is a participant
 * 2. Create the Message document in MongoDB
 * 3. Update the chat's latestMessage field (for sidebar preview)
 * 4. Return the fully populated message to the controller
 *    (Socket.io will then broadcast it to the other user in real-time)
 */
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType = 'text', fileUrl } = req.body;
    const senderId = req.user._id;

    logger.info(`[Send Message API] ${req.user.username} sending ${messageType} message to chatId: ${chatId}`);

    // Validate required fields
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId is required' });
    }
    if (messageType === 'text' && !content) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }
    if ((messageType === 'image' || messageType === 'file') && !fileUrl) {
      return res.status(400).json({ success: false, message: 'fileUrl is required for image/file messages' });
    }

    // Verify the chat exists and this user is a participant
    const chat = await Chat.findOne({ _id: chatId, users: { $in: [senderId] } });
    if (!chat) {
      logger.warn(`[Send Message API] Chat not found or user not a participant: ${chatId}`);
      return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
    }

    // Create the message in MongoDB
    const message = await Message.create({
      sender: senderId,
      chat: chatId,
      content: content || '',
      messageType,
      fileUrl: fileUrl || null,
    });

    // Update the chat's latestMessage so the sidebar shows the last message preview
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    // Populate sender details before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username avatar')
      .populate('chat');

    logger.success(`[Send Message API] Message sent successfully by ${req.user.username} in chat ${chatId}`);

    res.status(201).json({ success: true, message: populatedMessage });

  } catch (error) {
    logger.error(`[Send Message API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while sending message' });
  }
};

/**
 * @desc  Get all messages in a chat (with pagination)
 * @route GET /api/messages/:chatId
 * @access Private
 * query: ?page=1&limit=50
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    logger.info(`[Get Messages API] ${req.user.username} fetching messages for chatId: ${chatId} (page ${page})`);

    // Verify this user belongs to the chat
    const chat = await Chat.findOne({ _id: chatId, users: { $in: [req.user._id] } });
    if (!chat) {
      logger.warn(`[Get Messages API] Chat not found or access denied for ${req.user.username}`);
      return res.status(404).json({ success: false, message: 'Chat not found or access denied' });
    }

    // Fetch messages oldest-first (for chat view), with pagination
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({ chat: chatId });

    logger.info(`[Get Messages API] Returned ${messages.length} messages for chatId: ${chatId}`);

    res.status(200).json({
      success: true,
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
      },
    });

  } catch (error) {
    logger.error(`[Get Messages API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while fetching messages' });
  }
};

module.exports = { sendMessage, getMessages };
