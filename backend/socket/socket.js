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

  const onlineUsers = new Set();

  io.on('connection', (socket) => {
    logger.success(`[Socket.io] New connection: ${socket.id}`);

    // EVENT 1: User sets up their personal room after logging in
    socket.on('setup', (userData) => {
      socket.join(userData._id);
      onlineUsers.add(userData._id);
      
      // Tell everyone who is online
      io.emit('get-online-users', Array.from(onlineUsers));
      
      logger.info(`[Socket.io] User ${userData.username} online. Total: ${onlineUsers.size}`);
      socket.emit('connected');
    });

    // EVENT 2: User opens a specific chat
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      logger.info(`[Socket.io] Socket ${socket.id} joined chat room: ${chatId}`);
    });

    // EVENT 3: User leaves a chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      logger.info(`[Socket.io] Socket ${socket.id} left chat room: ${chatId}`);
    });

    // EVENT 4: A message is sent
    socket.on('send-message', (messageData) => {
      const chatId = messageData?.chat?._id || messageData?.chat;
      if (!chatId) return;

      // Broadcast to the chat room
      socket.to(chatId).emit('message-received', messageData);
      
      // Also notify each recipient specifically (in case they don't have the chat open)
      if (messageData.chat?.users) {
        messageData.chat.users.forEach(user => {
          if (user._id === messageData.sender._id) return;
          socket.to(user._id).emit('message-received', messageData);
        });
      }
    });

    // EVENT 5: Notify a specific user of incoming friend request
    socket.on('friend-request-sent', ({ receiverId, senderData }) => {
      io.to(receiverId).emit('friend-request-received', senderData);
      logger.info(`[Socket.io] Friend request notification sent to room: ${receiverId}`);
    });

    // EVENT 6: Notify sender that their request was accepted
    socket.on('friend-request-accepted', ({ senderId, accepterData }) => {
      io.to(senderId).emit('friend-request-was-accepted', accepterData);
      logger.info(`[Socket.io] Acceptance notification sent to room: ${senderId}`);
    });

    // EVENT 7: Typing indicator
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', chatId);
    });

    socket.on('stop-typing', (chatId) => {
      socket.to(chatId).emit('stop-typing', chatId);
    });

    // --- CALLING EVENTS (Signaling) ---
    socket.on('call-user', ({ to, offer, from, name, callType }) => {
      io.to(to).emit('incoming-call', { from, offer, name, callType });
    });

    socket.on('answer-call', ({ to, answer }) => {
      io.to(to).emit('call-accepted', { answer });
    });

    socket.on('reject-call', ({ to }) => {
      io.to(to).emit('call-rejected');
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { candidate });
    });

    socket.on('end-call', ({ to }) => {
      io.to(to).emit('call-ended');
    });

    // EVENT 8: User disconnects
    socket.on('disconnect', () => {
      // We need to find which user disconnected
      // For simplicity in this demo, we'll wait for the user to join again or use a map
      // A better way is mapping socket.id to userId
      logger.info(`[Socket.io] Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket };
