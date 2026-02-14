import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const Message = ({ message, setReplyMessage }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

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
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`group relative inline-block max-w-[65%] px-4 py-2 pr-8 rounded-2xl shadow-sm transition ${
          isMe
            ? "bg-black text-white rounded-br-md"
            : "bg-gray-200 text-black rounded-bl-md"
        }`}
      >
        {/* ================= 3 DOT MENU ================= */}
        {message.type !== "deleted" && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-gray-700"
          >
            ⋮
          </button>
        )}

        {showMenu && (
          <div className="absolute top-8 right-1 bg-white shadow-lg rounded-lg text-black text-sm z-50 min-w-[150px]">
            {/* Reply option for BOTH */}
            <button
              onClick={() => {
                setReplyMessage(message);
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Reply
            </button>

            {/* Delete for me (both users) */}
            <button
              onClick={() => handleDelete("me")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Delete for me
            </button>

            {/* Delete for everyone (ONLY sender) */}
            {isMe && (
              <button
                onClick={() => handleDelete("everyone")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
              >
                Delete for everyone
              </button>
            )}
          </div>
        )}

        {/* ================= REPLY PREVIEW ================= */}
        {message.replyTo && (
          <div className="border-l-4 border-gray-400 pl-2 mb-1 text-xs text-gray-500">
            {message.replyTo.content}
          </div>
        )}

        {/* ================= MESSAGE TYPES ================= */}
        {message.type === "text" && <p>{message.content}</p>}

        {message.type === "image" && (
          <img src={message.fileUrl} alt="img" className="rounded max-w-xs" />
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
          <p className="text-gray-400 italic text-xs">
            This message was deleted
          </p>
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
