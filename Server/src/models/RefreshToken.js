const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // MongoDB TTL index — automatically deletes document after 7 days
    expires: "7d",
  },
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
