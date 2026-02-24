const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");
const webpush = require("web-push");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { getDueReminders } = require("./src/controllers/note.controller");
const User = require("./src/models/User");

/* ─── DB ─── */
connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* ── Share io + onlineUsers with controllers via app ── */
const onlineUsers = new Map(); // userId → socketId
app.set("io",          io);
app.set("onlineUsers", onlineUsers);

/* ─────────────────────────────────────────────
   Web Push setup
───────────────────────────────────────────── */
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "admin@bolio.app"}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/* Helper: send push notification to a user by their DB subscription */
const sendPushNotification = async (subscription, payload) => {
  if (!subscription || !process.env.VAPID_PUBLIC_KEY) return;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — could clean up from DB here
      console.log("Push subscription expired");
    } else {
      console.error("Push error:", err.message);
    }
  }
};
/* Export so message.controller can use it */
app.set("sendPush", sendPushNotification);

// Socket logic
io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  /* ── User comes online ── */
  socket.on("user-online", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  /* ── Chat room management ── */
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`👥 User joined chat: ${chatId}`);
  });

  socket.on("leave-chat", (chatId) => {
    //Old chat ke room se nikalna → memory leak & wrong messages fix
    socket.leave(chatId);
  });

  /* ── New message: re-populate server-side so sender is never null ── */
  socket.on("new-message", async (message) => {
    try {
      if (!message?.chat) return;

      const chatId =
        typeof message.chat === "object" ? message.chat._id : message.chat;
      const chatObj =
        typeof message.chat === "object" ? message.chat : { _id: chatId };
      const users = chatObj.users || [];

      // Broadcast to everyone in the room except sender
      socket.to(chatId).emit("message-received", message);

      // Push notification to offline users
      for (const u of users) {
        const uid = typeof u === "object" ? u._id?.toString() : u?.toString();
        if (!uid || uid === message.sender?._id?.toString()) continue;
        if (onlineUsers.has(uid)) continue; // online — socket is enough

        const dbUser = await User.findById(uid).select("pushSubscription");
        if (dbUser?.pushSubscription) {
          await sendPushNotification(dbUser.pushSubscription, {
            title: `New message from ${message.sender?.username || "Someone"}`,
            body:
              message.type === "text"
                ? message.content?.slice(0, 80)
                : message.type === "image"
                  ? "📷 Sent a photo"
                  : message.type === "audio"
                    ? "🎵 Sent a voice message"
                    : "📄 Sent a file",
            icon: message.sender?.avatar || "/icon-192.png",
            url: "/chat",
          });
        }
      }
    } catch (err) {
      console.error("new-message socket error:", err.message);
    }
  });

  /* ── Typing indicators ── */
  socket.on("typing", ({ chatId }) =>
    socket.to(chatId).emit("typing", { chatId }),
  );
  socket.on("stop-typing", ({ chatId }) =>
    socket.to(chatId).emit("stop-typing", { chatId }),
  );

  /* ── Delivery & read receipts ── */
  socket.on("message-delivered", ({ chatId, messageId, userId }) => {
    socket.to(chatId).emit("message-delivered", {
      messageId,
      userId,
    });
  });

  socket.on("messages-read", ({ chatId, userId }) => {
    socket.to(chatId).emit("messages-seen", { chatId, userId });
  });

  // socket.on("messages-read", (data) =>
  //   socket.to(data.chatId).emit("messages-seen", data),
  // );
  // socket.on("message-delivered", (data) =>
  //   socket.to(data.chatId).emit("message-delivered", data),
  // );

  /* ── Delete message ── */
  socket.on("delete-message", ({ chatId, messageId, type }) => {
    socket.to(chatId).emit("message-deleted", { messageId, type });
  });

  /* ── Disconnect ── */
  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        break;
      }
    }
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

/* ─────────────────────────────────────────────────
   REMINDER CRON — runs every 60s
   Finds notes whose reminderAt has passed and
   emits a "reminder" event to the user's socket
   if they're currently online.
───────────────────────────────────────────────── */
setInterval(async () => {
  try {
    const due = await getDueReminders();

    for (const note of due) {
      const uid = note.user?._id
        ? note.user._id.toString()  
        : note.user?.toString();  

      if (!uid) continue;
      const socketId = onlineUsers.get(uid);

      // In-app toast
      if (socketId) {
        io.to(socketId).emit("reminder", {
          title: note.title,
          content: note.content,
        });
      }

      // Push notification (works even when tab is closed)
      const dbUser = await User.findById(uid).select("pushSubscription");
      if (dbUser?.pushSubscription) {
        await sendPushNotification(dbUser.pushSubscription, {
          title: `⏰ Reminder: ${note.title}`,
          body: note.content?.slice(0, 100) || "You have a reminder",
          icon: "/icon-192.png",
          url: "/chat",
        });
      }
    }
  } catch (err) {
    console.error("Reminder cron error:", err.message);
  }
}, 60_000);

server.listen(PORT, () =>
  console.log(`🚀 Server + Socket running on port ${PORT}`),
);
