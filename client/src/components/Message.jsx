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
