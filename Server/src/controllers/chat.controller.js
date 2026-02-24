const Chat = require("../models/Chat");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// @desc    Access or create 1-1 chat
// @route   POST /api/chat
// @access  Private
const accessChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "UserId is required" });

  // Guard: only accepted connections can open a chat
  const connected = await FriendRequest.findOne({
    $or: [
      { from: req.user._id, to: userId },
      { from: userId, to: req.user._id },
    ],
    status: "accepted",
  });

  if (!connected)
    return res.status(403).json({
      message: "You must be connected to start a chat",
    });

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  })
    .populate("users", "-password")
    .populate("lastMessage");

  if (chat) return res.status(200).json(chat);

  const newChat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  });
  const fullChat = await Chat.findById(newChat._id).populate(
    "users",
    "-password",
  );
  res.status(201).json(fullChat);
};

// @desc    Fetch all chats of logged-in user
// @route   GET /api/chat
// @access  Private
const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: { $in: [req.user._id] } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create group chat
// @route   POST /api/chat/group
// @access  Private
const createGroupChat = async (req, res) => {
  const { users, name } = req.body;
  if (!users || !name)
    return res
      .status(400)
      .json({ message: "Users and group name are required" });

  const groupChat = await Chat.create({
    chatName: name,
    users: [...users, req.user._id],
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(201).json(fullGroupChat);
};

module.exports = { accessChat, fetchChats, createGroupChat };
