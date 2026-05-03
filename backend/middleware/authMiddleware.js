const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * MIDDLEWARE: protect
 * 
 * HOW IT WORKS:
 * 1. Frontend sends every private request with a header:
 *      Authorization: Bearer <accessToken>
 * 2. This middleware intercepts the request BEFORE it reaches the controller
 * 3. It extracts the token, verifies it, finds the user from DB
 * 4. Attaches the user to req.user so the controller can use it
 * 5. If anything fails → request is blocked with 401 Unauthorized
 */

const protect = async (req, res, next) => {
  try {
    let token;

    // Step 1: Check if Authorization header exists and starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      
      // Step 2: Extract the token part — "Bearer eyJhbGciOiJ..." → "eyJhbGciOiJ..."
      token = req.headers.authorization.split(' ')[1];
      
    } else {
      logger.warn('[Auth Middleware] No token provided in Authorization header');
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    // Step 3: Verify the token using the same secret used to sign it
    //         If token is expired or tampered → jwt.verify throws an error
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_secret');
    // decoded = { id: 'userId123', iat: ..., exp: ... }

    // Step 4: Find the user from DB using the ID inside the token
    //         We exclude the password field — no need to send it further
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      logger.warn(`[Auth Middleware] Token valid but user not found for id: ${decoded.id}`);
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    // Step 5: Attach user to request object — controllers can now access req.user
    req.user = user;
    logger.info(`[Auth Middleware] Access granted to user: ${user.username} (${user._id})`);

    // Step 6: Pass control to the next function (the actual controller)
    next();

  } catch (error) {
    // JWT verification failed — token is either expired or invalid
    if (error.name === 'TokenExpiredError') {
      logger.warn('[Auth Middleware] Token expired');
      return res.status(401).json({ success: false, message: 'Session expired, please login again' });
    }

    logger.error(`[Auth Middleware] Invalid token: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
