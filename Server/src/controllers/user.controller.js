const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const Chat = require("../models/Chat");

const getIO = (req) => req.app.get("io");
const getOnlineUsers = (req) => req.app.get("onlineUsers");

/* ─────────────────────────────────────────────
   GET /api/user/vapid-public-key  (no auth)
   Frontend fetches this instead of needing a client .env
───────────────────────────────────────────── */
const getVapidPublicKey = (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(500).json({ message: "VAPID not configured" });
  res.json({ publicKey: key });
};

/* ─────────────────────────────────────────────
   GET /api/user/search?q=username
───────────────────────────────────────────── */
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.json([]);

    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: req.user._id },
    })
      .select("username avatar about")
      .limit(10);

    const myId = req.user._id.toString();

    const results = await Promise.all(
      users.map(async (u) => {
        const request = await FriendRequest.findOne({
          $or: [
            { from: myId, to: u._id },
            { from: u._id, to: myId },
          ],
        });

        let relationStatus = "none";
        let requestId = null;

        if (request) {
          requestId = request._id;
          if (request.status === "accepted") {
            relationStatus = "friends";
          } else if (request.status === "pending") {
            relationStatus =
              request.from.toString() === myId ? "sent" : "incoming";
          } else if (request.status === "declined") {
            relationStatus = "none";
          }
        }

        return {
          _id: u._id,
          username: u.username,
          avatar: u.avatar,
          about: u.about,
          relationStatus,
          requestId,
        };
      }),
    );

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   POST /api/user/request/:userId
   → emits "friend-request-received" to recipient
───────────────────────────────────────────── */
const sendRequest = async (req, res) => {
  try {
    const toId = req.params.userId;
    const fromId = req.user._id;

    if (toId === fromId.toString())
      return res
        .status(400)
        .json({ message: "Cannot send request to yourself" });

    const existing = await FriendRequest.findOne({
      $or: [
        { from: fromId, to: toId },
        { from: toId, to: fromId },
      ],
    });

    let request;
    if (existing) {
      if (existing.status === "accepted")
        return res.status(400).json({ message: "Already connected" });
      if (existing.status === "pending")
        return res.status(400).json({ message: "Request already sent" });
      existing.status = "pending";
      existing.from = fromId;
      existing.to = toId;
      await existing.save();
      request = existing;
    } else {
      request = await FriendRequest.create({ from: fromId, to: toId });
    }

    const populated = await FriendRequest.findById(request._id).populate([
      { path: "from", select: "username avatar" },
      { path: "to", select: "username avatar" },
    ]);

    /* ── Real-time: notify recipient if online ── */
    const io = getIO(req);
    const onlineUsers = getOnlineUsers(req);
    const toSocketId = onlineUsers?.get(toId);
    if (toSocketId) {
      io.to(toSocketId).emit("friend-request-received", {
        request: populated,
        from: populated.from,
        message: `${populated.from.username} sent you a connection request`,
      });
    }

    /* ── Push notification if offline ── */
    if (!toSocketId) {
      const sendPush = req.app.get("sendPush");
      const toUser = await User.findById(toId).select("pushSubscription");
      if (toUser?.pushSubscription && sendPush) {
        await sendPush(toUser.pushSubscription, {
          title: "New connection request",
          body: `${req.user.username} sent you a connection request`,
          icon: req.user.avatar || "/icon-192.png",
          url: "/chat",
        });
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/user/request/:requestId/accept
   → creates Chat
   → emits "friend-request-accepted" to BOTH users
───────────────────────────────────────────── */
const acceptRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId)
      .populate("from", "username avatar about")
      .populate("to", "username avatar about");

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.to._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (request.status !== "pending")
      return res.status(400).json({ message: "Request already handled" });

    request.status = "accepted";
    await request.save();

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [request.from._id, request.to._id] },
    });

    if (!chat) {
      chat = await Chat.create({
        chatName: "sender",
        isGroupChat: false,
        users: [request.from._id, request.to._id],
      });
    }

    const fullChat = await Chat.findById(chat._id)
      .populate("users", "-password")
      .populate("lastMessage");

    /* ── Real-time: push new chat to BOTH users ── */
    const io = getIO(req);
    const onlineUsers = getOnlineUsers(req);
    const fromId = request.from._id.toString();
    const toId = request.to._id.toString();
    const fromSocket = onlineUsers?.get(fromId);
    const toSocket = onlineUsers?.get(toId);

    const payload = {
      chat,
      request: { _id: request._id, status: "accepted" },
      acceptedBy: {
        _id: request.to._id,
        username: request.to.username,
        avatar: request.to.avatar,
      },
    };

    if (toSocket) io.to(toSocket).emit("friend-request-accepted", payload);
    if (fromSocket)
      io.to(fromSocket).emit("friend-request-accepted", {
        ...payload,
        message: `${request.to.username} accepted your connection request`,
      });

    /* ── Push notification to User A if offline ── */
    if (!fromSocket) {
      const sendPush = req.app.get("sendPush");
      const fromUser = await User.findById(fromId).select("pushSubscription");
      if (fromUser?.pushSubscription && sendPush) {
        await sendPush(fromUser.pushSubscription, {
          title: "Connection request accepted!",
          body: `${request.to.username} accepted your connection request. Start chatting!`,
          icon: request.to.avatar || "/icon-192.png",
          url: "/chat",
        });
      }
    }

    res.json({ request, chat: fullChat });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   PUT /api/user/request/:requestId/decline
───────────────────────────────────────────── */
const declineRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.to.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    request.status = "declined";
    await request.save();
    res.json({ message: "Request declined" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/user/request/:requestId
───────────────────────────────────────────── */
const cancelRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.from.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    await request.deleteOne();
    res.json({ message: "Request cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   GET /api/user/requests
───────────────────────────────────────────── */
const getIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user._id,
      status: "pending",
    })
      .populate("from", "username avatar about")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ─────────────────────────────────────────────
   POST /api/user/push-subscription
───────────────────────────────────────────── */
const savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription)
      return res.status(400).json({ message: "Subscription required" });
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription,
    });
    res.json({ message: "Subscription saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getVapidPublicKey,
  searchUsers,
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  getIncomingRequests,
  savePushSubscription,
};
