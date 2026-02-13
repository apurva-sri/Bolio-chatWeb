import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const Message = ({ message, setReplyMessage }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const isMe = message.sender?._id
    ? message.sender._id === user._id
    : message.sender === user._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalUsers = message.chat?.users?.length || 2;
  const readCount = (message.readBy?.length || 1) - 1;
  const isGroup = message.chat?.isGroupChat;
  const allRead = readCount === totalUsers - 1;
  const isDelivered = message.deliveredTo?.length > 0;

  /* =========================
     DELETE HANDLER
  ========================= */
  const handleDelete = async (type) => {
    try {
      if (type === "me") {
        await API.put(`/message/delete/me/${message._id}`);
      } else {
        await API.put(`/message/delete/everyone/${message._id}`);
      }

      setShowMenu(false);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`relative px-3 py-2 rounded max-w-xs text-sm ${
          isMe ? "bg-black text-white" : "bg-gray-200 text-black"
        }`}
      >
        {/* 3 DOT MENU */}
        {isMe && message.type !== "deleted" && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="absolute -top-2 -right-2 text-xs opacity-70"
          >
            ⋮
          </button>
        )}

        {/* DROPDOWN */}
        {showMenu && (
          <div className="absolute right-0 top-6 bg-white shadow rounded text-black text-sm z-10">
            <button
              onClick={() => {
                setReplyMessage(message);
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Reply
            </button>

            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleDelete("me")}
            >
              Delete for me
            </div>

            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleDelete("everyone")}
            >
              Delete for everyone
            </div>
          </div>
        )}

        {/* REPLY PREVIEW */}
        {message.replyTo && (
          <div className="border-l-4 border-gray-400 pl-2 mb-1 text-xs text-gray-500">
            {message.replyTo.content}
          </div>
        )}

        {/* CONTENT TYPES */}
        {message.type === "text" && <p>{message.content}</p>}

        {message.type === "image" && (
          <img src={message.fileUrl} alt="img" className="rounded max-w-xs" />
        )}

        {message.type === "file" && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400"
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

        {/* TIME + TICKS */}
        <div className="flex justify-end items-center gap-1 text-xs mt-1 opacity-70">
          <span>{time}</span>

          {isMe && message.type !== "deleted" && (
            <span className={allRead ? "text-blue-500" : "text-gray-400"}>
              {isDelivered ? "✓✓" : "✓"}
            </span>
          )}
        </div>

        {isGroup && allRead && (
          <p className="text-[10px] text-gray-500 mt-1">
            Seen by {readCount} users
          </p>
        )}
      </div>
    </div>
  );
};

export default Message;
