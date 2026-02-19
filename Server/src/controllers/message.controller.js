const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

// @desc    Send message (TEXT / IMAGE / FILE)
// @route   POST /api/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content, chatId, replyTo } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "chatId required" });
    }

    let messageData = {
      sender: req.user._id,
      chat: chatId,
      deliveredTo: [],
      readBy: [req.user._id],
      replyTo: replyTo || null,
    };


    /* FILE / IMAGE / AUDIO (Cloudinary) */
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", type: "upload", access_mode: "public" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Error in Message:", error);
            return res.status(500).json({ message: "Upload failed" });
          }

          const isImage =
            req.file.mimetype.startsWith("image/") && result.format !== "pdf";

          if (isImage) {
            messageData.type = "image";
          } else if (result.resource_type === "video") {
            messageData.type = "audio"; //audio comes as video/mp3
          } else {
            messageData.type = "file";
          }

          messageData.content = req.file.originalname || "Voice message";
          messageData.fileUrl = result.secure_url.replace(
            "/image/upload/",
            `/${result.resource_type}/upload/`,
          );

          let message = await Message.create(messageData);
          message = await message.populate("sender", "username avatar");
          message = await message.populate("chat");
          message = await message.populate("replyTo");

          await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
          });

          return res.status(201).json(message);
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      return;
    }

    // TEXT MESSAGE 
    if (!content) {
      return res.status(400).json({ message: "content required" });
    }

    messageData.type = "text";
    messageData.content = content;

    let message = await Message.create(messageData);

    message = await message.populate("sender", "username avatar");
    message = await message.populate("chat");
    message = await message.populate("replyTo");

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    return res.status(201).json(message);
  } catch (err) {
    console.error("Send Message Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all messages of a chat
// @route   GET /api/message/:chatId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username avatar")
      .populate("replyTo", "content type sender")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/message/read/:chatId
// @access  Private
const markMessagesRead = async (req, res) => {
  try {
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @route PUT /api/message/delivered/:id
const markDelivered = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, {
      $addToSet: { deliveredTo: req.user._id },
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @route PUT /api/message/delete/me/:messageId
const deleteForMe = async (req, res) => {
  try {
    // FIX: was "seleteFor" (typo) → correct field is "deletedFor"
    await Message.findByIdAndUpdate(req.params.messageId, {
      $addToSet: { deletedFor: req.user._id },
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @route PUT /api/message/delete/everyone/:messageId
const deleteForEveryone = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not allowed" });

    message.type = "deleted";
    message.content = "";
    message.fileUrl = "";
    message.isDeletedForEveryone = true;
    await message.save();

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessagesRead,
  markDelivered,
  deleteForMe,
  deleteForEveryone,
};
