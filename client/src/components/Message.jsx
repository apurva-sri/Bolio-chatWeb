import React from "react";
import { useAuth } from "../context/AuthContext";

const Message = ({ message }) => {
  const { user } = useAuth();

  const isMe = message.sender._id === user._id;

  // format time like 5:42 PM
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalUsers = message.chat?.users?.length || 2;
  const readCount = (message.readBy?.length || 1) - 1; // exclude sender

  const isGroup = message.chat?.isGroupChat;
  const allRead = readCount === totalUsers - 1;

  // sender + receiver = seen
  const isDelivered = message.deliveredTo?.length > 0;
  const isRead = message.readBy?.length > 1;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`px-3 py-2 rounded max-w-xs text-sm ${
          isMe ? "bg-black text-white" : "bg-gray-200"
        }`}
      >
        <p>{message.content}</p>

        {/* time + ticks */}
        <div className="flex justify-end items-center gap-1 text-xs mt-1 opacity-70">
          <span>{time}</span>

          {isMe && (
            <span className={allRead ? "text-blue-500" : "text-gray-400"}>
              {message.deliveredTo?.length > 0 ? "✓✓" : "✓"}
            </span>
          )}

          {/* Group read info */}
          {isGroup && allRead && (
            <p className="text-[10px] text-gray-500 mt-1">
              Seen by {readCount} users
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
