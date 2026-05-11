const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes   = require('./routes/authRoutes');
const userRoutes   = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const chatRoutes   = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const productivityRoutes = require('./routes/productivityRoutes');
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket/socket');
dotenv.config();

connectDB();

const app = express();
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats',   chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/productivity', productivityRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*", // allow all in dev, update in prod
  },
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
