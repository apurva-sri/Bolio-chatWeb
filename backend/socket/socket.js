const logger = require('../config/logger');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

// Connect to the same Redis instance we use for OTPs
const pubClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => logger.error(`[Redis PubClient Error] ${err}`));
subClient.on('error', (err) => logger.error(`[Redis SubClient Error] ${err}`));

/**
 * SOCKET.IO — Real-time event handler (Microservices Ready)
 * ...
 */
const initSocket = (io) => {
  // Attach Redis Adapter to allow cross-server event broadcasting!
  io.adapter(createAdapter(pubClient, subClient));
  logger.success('[Socket.io] Redis Adapter attached. Ready for horizontal scaling.');

  io.on('connection', (socket) => {
    logger.success(`[Socket.io] New connection: ${socket.id}`);

    // EVENT 1: User sets up their personal room after logging in
    // Frontend emits this with the logged-in user's data
    socket.on('setup', (userData) => {
      socket.join(userData._id); // Each user has a personal room = their userId
      logger.info(`[Socket.io] User ${userData.username} joined personal room: ${userData._id}`);
      socket.emit('connected'); // Tell frontend the socket is ready
    });

    // EVENT 2: User opens a specific chat — joins that chat's room
    // This ensures they receive messages only for chats they have open
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      logger.info(`[Socket.io] Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // EVENT 3: User leaves a chat room (e.g., opens a different chat)
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      logger.info(`[Socket.io] Socket ${socket.id} left chat room: ${chatId}`);
    });

    // EVENT 4: A message is sent — broadcast to everyone in the chat room except sender
    // Frontend emits this AFTER the REST API saves the message to MongoDB
    socket.on('send-message', (messageData) => {
      const chatId = messageData?.chat?._id || messageData?.chat;
      if (!chatId) return;

      // Emit to all users in the chat room EXCEPT the sender
      socket.to(chatId).emit('message-received', messageData);
      logger.info(`[Socket.io] Message broadcast to chat room: ${chatId}`);
    });

    // EVENT 5: Notify a specific user of incoming friend request (real-time notification)
    // Frontend emits this after calling POST /api/friends/send-request
    socket.on('friend-request-sent', ({ receiverId, senderData }) => {
      io.to(receiverId).emit('friend-request-received', senderData);
      logger.info(`[Socket.io] Friend request notification sent to room: ${receiverId}`);
    });

    // EVENT 6: Notify sender that their request was accepted
    socket.on('friend-request-accepted', ({ senderId, accepterData }) => {
      io.to(senderId).emit('friend-request-was-accepted', accepterData);
      logger.info(`[Socket.io] Acceptance notification sent to room: ${senderId}`);
    });

    // EVENT 7: Typing indicator — tell the other user someone is typing
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', chatId);
    });

    socket.on('stop-typing', (chatId) => {
      socket.to(chatId).emit('stop-typing', chatId);
    });

    // EVENT 8: User disconnects
    socket.on('disconnect', () => {
      logger.info(`[Socket.io] Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket };
