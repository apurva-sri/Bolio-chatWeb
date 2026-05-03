const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else {
      logger.warn('[Auth Middleware] No token provided in Authorization header');
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      logger.warn(`[Auth Middleware] Token valid but user not found for id: ${decoded.id}`);
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    logger.info(`[Auth Middleware] Access granted to user: ${user.username} (${user._id})`);

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('[Auth Middleware] Token expired');
      return res.status(401).json({ success: false, message: 'Session expired, please login again' });
    }
    logger.error(`[Auth Middleware] Invalid token: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
