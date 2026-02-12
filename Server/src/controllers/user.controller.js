const User = require("../models/User.js");

// GET /api/user?search=apurva
const searchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: "i" } },
        //   { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } }) // exclude self
    .select("-password");

  res.json(users);
};

module.exports = { searchUsers };
