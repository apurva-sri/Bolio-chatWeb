const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

/* ─── helper: save refresh token to DB ─── */
const saveRefreshToken = async (userId, token) => {
  await RefreshToken.deleteMany({ user: userId }); // one active session per user
  await RefreshToken.create({ user: userId, token });
};

/* ─── helper: build user response payload ─── */
const userPayload = (user, accessToken, refreshToken) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  about: user.about,
  accessToken,
  refreshToken,
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ username, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await saveRefreshToken(user._id, refreshToken);

    res.status(201).json(userPayload(user, accessToken, refreshToken));
  } catch (err) {
    console.error("REGISTER ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    await saveRefreshToken(user._id, refreshToken);

    res.status(200).json(userPayload(user, accessToken, refreshToken));
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// Body: { refreshToken }
// Returns: new accessToken (+ rotated refreshToken)
// ─────────────────────────────────────────────
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token required" });

    // Check token exists in DB (not revoked)
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored)
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });

    // Verify signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      await RefreshToken.deleteOne({ token: refreshToken }); // clean up expired
      return res
        .status(403)
        .json({ message: "Refresh token expired, please login again" });
    }

    // Rotate: issue new pair (refresh token rotation = extra security)
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);
    await saveRefreshToken(decoded.id, newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("REFRESH ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/logout
// Revokes refresh token from DB
// ─────────────────────────────────────────────
const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// ─────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username, about } = req.body;
    if (username) user.username = username;
    if (about !== undefined) user.about = about;

    if (req.file) {
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "avatars" },
          (error, result) => {
            if (error) return reject(error);
            user.avatar = result.secure_url;
            resolve();
          },
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    }

    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      about: user.about,
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateProfile,
};
