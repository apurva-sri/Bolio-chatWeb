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
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./socket/socket');
dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats',   chatRoutes);
app.use('/api/messages', messageRoutes);

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
