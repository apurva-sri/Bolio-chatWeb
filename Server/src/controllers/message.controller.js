const Message = require("../models/Message");
const Chat = require("../models/Chat");

// @desc    Send message (TEXT / IMAGE / FILE)
// @route   POST /api/message
// @access  Private
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "chatId required" });
  }

  let messageData = {
    sender: req.user._id,
    chat: chatId,
    deliveredTo: [],
    readBy: [req.user._id],
  };

  // FILE / IMAGE MESSAGE
  if (req.file) {
    messageData.type = req.file.mimetype.startsWith("image")
      ? "image"
      : "file";

    messageData.content = req.file.originalname;
    messageData.fileUrl = `/uploads/${req.file.filename}`;
  }
  // TEXT MESSAGE
  else {
    if (!content) {
      return res.status(400).json({ message: "content required" });
    }
    messageData.type = "text";
    messageData.content = content;
  }

  let message = await Message.create(messageData);

  message = await message.populate("sender", "username avatar");
  message = await message.populate("chat");

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
  });

  res.status(201).json(message);
};

// @desc    Get all messages of a chat
// @route   GET /api/message/:chatId
// @access  Private
const getMessages = async (req, res) => {
  const messages = await Message.find({
    chat: req.params.chatId,
  })
    .populate("sender", "username avatar")
    .sort({ createdAt: 1 });

  res.status(200).json(messages);
};

// @desc    Mark messages as read
// @route   PUT /api/message/read/:chatId
// @access  Private
const markMessagesRead = async (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.user._id;

  await Message.updateMany(
    {
      chat: chatId,
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    }
  );

  res.status(200).json({ success: true });
};

// @route PUT /api/message/delivered/:id
const markDelivered = async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;

  await Message.findByIdAndUpdate(messageId, {
    $addToSet: { deliveredTo: userId },
  });

  res.status(200).json({ success: true });
};



module.exports = { sendMessage, getMessages, markMessagesRead, markDelivered };
