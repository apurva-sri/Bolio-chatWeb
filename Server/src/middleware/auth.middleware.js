const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Use JWT_ACCESS_SECRET (short-lived token)
      // Falls back to JWT_SECRET for backward compatibility
      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);

      // generateToken signs with { id } not { _id }
      const userId = decoded.id || decoded._id;
      req.user = await User.findById(userId).select("-password");

      if (!req.user) return res.status(401).json({ message: "User not found" });

      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError")
        return res.status(401).json({ message: "Access token expired" });
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token)
    return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };
