const app = require("./src/app");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

const onlineUsers = new Map(); // userId -> socketId

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Socket logic
io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  socket.on("user-online", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

   socket.on("leave-chat", (chatId) => {
     //Old chat ke room se nikalna → memory leak & wrong messages fix
     socket.leave(chatId);
   });

  socket.on("new-message", (message) => {
    const chatId = message.chat._id;
    socket.to(chatId).emit("message-received", message);
  });

  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });

  socket.on("stop-typing", (chatId) => {
    socket.to(chatId).emit("stop-typing");
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }

    console.log("❌ Socket disconnected:", socket.id);
  });
});

// listen on server, not app
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});
