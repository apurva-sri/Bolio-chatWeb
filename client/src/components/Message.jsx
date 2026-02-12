import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Message = ({ message }) => {
  const { user } = useAuth();

  const [showMenu, setShowMenu] = useState(false);

  const isMe = message.sender?._id === user._id;

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

        socket.emit("message-delete", {
          chatId: message.chat._id,
          messageId: message._id,
          type: "everyone",
        });
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
        {/* 3 DOT MENU BUTTON */}
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
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleDelete("me")}
            >
              Delete for me
            </div>

            {isMe && (
              <div
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleDelete("everyone")}
              >
                Delete for everyone
              </div>
            )}
          </div>
        )}

        {/* TEXT */}
        {message.type === "text" && <p>{message.content}</p>}

        {/* IMAGE */}
        {message.type === "image" && (
          <img src={message.fileUrl} alt="img" className="rounded max-w-xs" />
        )}

        {/* FILE */}
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

        {/* AUDIO */}
        {message.type === "audio" && (
          <audio controls className="w-64">
            <source src={message.fileUrl} type="audio/webm" />
          </audio>
        )}

        {/* DELETED MESSAGE */}
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

        {/* GROUP READ INFO */}
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
