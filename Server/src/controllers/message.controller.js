const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

/* ── Shared populate helper ── */
const populateMessage = (query) =>
  query
    .populate("sender", "username avatar")
    .populate("chat")
    .populate({
      path: "replyTo",
      select: "content type fileUrl sender",
      populate: { path: "sender", select: "username avatar _id" },
    });

/* ─────────────────────────────────────────────
   POST /api/message
───────────────────────────────────────────── */
const sendMessage = async (req, res) => {
  try {
    const { content, chatId, replyTo } = req.body;
    if (!chatId) return res.status(400).json({ message: "chatId required" });

    let messageData = {
      sender: req.user._id,
      chat: chatId,
      deliveredTo: [],
      readBy: [req.user._id],
      replyTo: replyTo || null,
    };

    /* ── FILE / IMAGE / AUDIO upload to Cloudinary ── */
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", type: "upload", access_mode: "public" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Error:", error);
            return res.status(500).json({ message: "Upload failed" });
          }

          const isImage =
            req.file.mimetype.startsWith("image/") && result.format !== "pdf";

          messageData.type = isImage
            ? "image"
            : result.resource_type === "video"
              ? "audio"
              : "file";

          messageData.content = req.file.originalname || "Voice message";
          messageData.fileUrl = result.secure_url.replace(
            "/image/upload/",
            `/${result.resource_type}/upload/`,
          );
          messageData.fileSize = req.file.size;

          let message = await Message.create(messageData);
          message = await populateMessage(Message.findById(message._id));

          await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });
          return res.status(201).json(message);
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      return;
    }

    /* ── TEXT ── */
    if (!content) return res.status(400).json({ message: "content required" });

    messageData.type = "text";
    messageData.content = content;

    let message = await Message.create(messageData);
    message = await populateMessage(Message.findById(message._id));

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });
    return res.status(201).json(message);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   GET /api/message/:chatId
───────────────────────────────────────────── */
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username avatar")
      .populate({
        path: "replyTo",
        select: "content type fileUrl sender",
        populate: { path: "sender", select: "username avatar _id" },
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/message/read/:chatId
───────────────────────────────────────────── */
const markMessagesRead = async (req, res) => {
  try {
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } },
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/message/delivered/:id
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   PUT /api/message/delete/me/:messageId
───────────────────────────────────────────── */
const deleteForMe = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.messageId, {
      $addToSet: { deletedFor: req.user._id },
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/message/delete/everyone/:messageId
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   GET /api/message/unread-counts
   Returns { chatId: count } map for current user
   Called by ChatList on mount and on new message
───────────────────────────────────────────── */
const getUnreadCounts = async (req, res) => {
  try {
    const counts = await Message.aggregate([
      {
        $match: {
          readBy: { $ne: req.user._id },
          sender: { $ne: req.user._id },
        },
      },
      {
        $group: {
          _id: "$chat",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {};
    counts.forEach(({ _id, count }) => {
      result[_id.toString()] = count;
    });

    res.status(200).json(result);
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
  getUnreadCounts,
};
