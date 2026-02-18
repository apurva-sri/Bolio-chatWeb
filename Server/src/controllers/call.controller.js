const Call = require("../models/Call");

// POST /api/calls  — log a call
const logCall = async (req, res) => {
  try {
    const { receiverId, type, status, duration } = req.body;
    const call = await Call.create({
      caller: req.user._id,
      receiver: receiverId,
      type,
      status,
      duration,
    });
    const populated = await call.populate([
      { path: "caller", select: "username avatar" },
      { path: "receiver", select: "username avatar" },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/calls  — get call history for logged-in user
const getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [{ caller: req.user._id }, { receiver: req.user._id }],
    })
      .populate("caller", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { logCall, getCallHistory };
