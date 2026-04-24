const jwt = require('jsonwebtoken');

// Access Token expires relatively quickly (e.g., 15 minutes)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET || "fallback_secret",
    {
      expiresIn: "15m",
    },
  );
};

// Refresh Token lasts much longer (e.g., 7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
    expiresIn: '7d',
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
