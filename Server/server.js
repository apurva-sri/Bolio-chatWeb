const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const Message = require("./src/models/Message");
const { getDueReminders } = require("./src/controllers/note.controller");

/* ─── DB ─── */
connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

/* ─── Online users: userId → socketId ─── */
const onlineUsers = new Map();

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

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
      const chatId = message.chat?._id || message.chat;
      const fullMessage = await Message.findById(message._id)
        .populate("sender", "username avatar")
        .populate("chat")
        .populate("replyTo", "content type sender");

      if (fullMessage) {
        socket.to(chatId).emit("message-received", fullMessage);
      }
    } catch (err) {
      console.error("new-message socket error:", err.message);
    }
  });

  /* ── Typing indicators ── */
  socket.on("typing", (chatId) => socket.to(chatId).emit("typing"));
  socket.on("stop-typing", (chatId) => socket.to(chatId).emit("stop-typing"));

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

  /* ── Delete message ── */
  socket.on("delete-message", ({ chatId, messageId, type }) => {
    socket.to(chatId).emit("message-deleted", { messageId, type });
  });

  /* ── Disconnect ── */
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }
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
    const dueNotes = await getDueReminders();
    dueNotes.forEach((note) => {
      const socketId = onlineUsers.get(note.user._id.toString());
      if (socketId) {
        io.to(socketId).emit("reminder", {
          noteId:  note._id,
          title:   note.title,
          content: note.content,
        });
        console.log(`🔔 Reminder sent to user ${note.user._id} for note: ${note.title}`);
      }
    });
  } catch (err) {
    console.error("Reminder cron error:", err.message);
  }
}, 60_000);

/* ─── Start ─── */
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});

