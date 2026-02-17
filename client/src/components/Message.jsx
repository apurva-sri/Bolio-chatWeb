import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import ImagePreview from "./ImagePreview";

const Message = ({ message, setReplyMessage }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // safer sender check
  const senderId =
    typeof message.sender === "object" ? message.sender?._id : message.sender;

  const isMe = senderId === user._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDelivered = message.deliveredTo?.length > 0;
  const isRead = message.readBy?.length > 1;

  /* =========================
     DELETE HANDLER
  ========================= */
  const handleDelete = async (type) => {
    try {
      await API.put(`/message/delete/${type}/${message._id}`);
      setShowMenu(false);
    } catch (err) {
      console.log(err);
    }
  };

return (
  <div
    className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4 relative`}
  >
    <div
      className={`group relative inline-block max-w-[70%] px-4 py-2 pr-8 rounded-2xl shadow-sm transition ${
        isMe
          ? "bg-black text-white rounded-br-md"
          : "bg-gray-200 text-black rounded-bl-md"
      }`}
    >
      {/* ================= 3 DOT BUTTON ================= */}
      {message.type !== "deleted" && (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`absolute bottom-1 ${
            isMe ? "right-2" : "left-2"
          } opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-700`}
        >
          ⋮
        </button>
      )}

      {/* ================= DROPDOWN ================= */}
      {showMenu && (
        <div
          className={`absolute ${
            isMe ? "right-0" : "left-0"
          } bottom-full mb-2 bg-white shadow-xl rounded-xl text-black text-sm z-50 min-w-[180px] border`}
        >
          <button
            onClick={() => {
              setReplyMessage(message);
              setShowMenu(false);
            }}
            className="block w-full text-left px-4 py-3 hover:bg-gray-100"
          >
            Reply
          </button>

          <button
            onClick={() => handleDelete("me")}
            className="block w-full text-left px-4 py-3 hover:bg-gray-100"
          >
            Delete for me
          </button>

          {isMe && (
            <button
              onClick={() => handleDelete("everyone")}
              className="block w-full text-left px-4 py-3 hover:bg-gray-100 text-red-500"
            >
              Delete for everyone
            </button>
          )}
        </div>
      )}

      {/* ================= MESSAGE TYPES ================= */}

      {message.type === "text" && (
        <p className="break-words">{message.content}</p>
      )}

      {message.type === "image" && (
        <>
          <div
            className={`rounded-2xl overflow-hidden cursor-pointer ${
              isMe ? "bg-green-600" : "bg-gray-300"
            }`}
            onClick={() => setShowPreview(true)}
          >
            <img
              src={message.fileUrl}
              alt="img"
              className="max-h-[400px] w-full object-contain"
            />
          </div>

          {showPreview && (
            <ImagePreview
              imageUrl={message.fileUrl}
              onClose={() => setShowPreview(false)}
            />
          )}
        </>
      )}

      {message.type === "file" && (
        <div
          className={`rounded-2xl p-4 w-72 cursor-pointer transition ${
            isMe ? "bg-green-200" : "bg-gray-100"
          }`}
          onClick={() => window.open(message.fileUrl, "_blank")}
        >
          <div className="flex items-center gap-3">
            {/* PDF Icon */}
            <div className="bg-red-500 text-white font-bold px-2 py-1 rounded text-xs">
              PDF
            </div>

            {/* File Info */}
            <div className="flex-1">
              <p className="font-semibold truncate">{message.content}</p>
              <p className="text-xs text-gray-600 opacity-70">
                {message.fileSize
                  ? `${(message.fileSize / 1024).toFixed(1)} KB`
                  : "Document"}
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between text-sm font-medium mt-3">
            <span className="text-green-800">Open</span>
            <span
              className="text-green-800"
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement("a");
                link.href = message.fileUrl;
                link.download = message.content;
                link.click();
              }}
            >
              Save as
            </span>
          </div>
        </div>
      )}

      {message.type === "audio" && (
        <audio controls className="w-64">
          <source src={message.fileUrl} type="audio/webm" />
        </audio>
      )}

      {message.type === "deleted" && (
        <p className="text-gray-400 italic text-xs">This message was deleted</p>
      )}

      {/* ================= TIME + TICKS ================= */}
      <div className="flex justify-end items-center gap-1 text-[11px] mt-1 opacity-60">
        <span>{time}</span>

        {isMe && message.type !== "deleted" && (
          <span className={isRead ? "text-blue-500" : "text-gray-400"}>
            {isDelivered ? "✓✓" : "✓"}
          </span>
        )}
      </div>
    </div>
  </div>
);
};

export default Message;
