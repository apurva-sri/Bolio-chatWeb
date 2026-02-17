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
          <img
            src={message.fileUrl}
            alt="img"
            onClick={() => setShowPreview(true)}
            className="rounded max-w-xs cursor-pointer hover:opacity-90 transition"
          />

          {showPreview && (
            <ImagePreview
              imageUrl={message.fileUrl}
              onClose={() => setShowPreview(false)}
            />
          )}
        </>
      )}

      {message.type === "file" && (
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-500"
        >
          📎 {message.content}
        </a>
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
