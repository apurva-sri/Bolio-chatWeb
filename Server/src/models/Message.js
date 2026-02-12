const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    content: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "file", "audio", "video"],
      default: "text",
    },

    deliveredTo: [
      //Sender is NOT included in deliveredTo
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    fileUrl: {
      type: String,
    },
    fileName: {
      type: String,
    },

    deleteFor:[{type: mongoose.Schema.Types.ObjectId, ref:"User"}],
    isDeletedForEveryone: {type: Boolean, default: false},
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
