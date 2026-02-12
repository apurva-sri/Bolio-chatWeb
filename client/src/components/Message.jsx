import React from "react";
import { useAuth } from "../context/AuthContext";

const Message = ({ message }) => {
  const { user } = useAuth();
  const isMe = message.sender._id === user._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalUsers = message.chat?.users?.length || 2;
  const readCount = (message.readBy?.length || 1) - 1;
  const isGroup = message.chat?.isGroupChat;
  const allRead = readCount === totalUsers - 1;

  const isDelivered = message.deliveredTo?.length > 0;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`px-3 py-2 rounded max-w-xs text-sm ${
          isMe ? "bg-black text-white" : "bg-gray-200"
        }`}
      >
        {/* TEXT */}
        {message.type === "text" && <p>{message.content}</p>}

        {/* IMAGE without Cloudinary */}
        {/* {message.type === "image" && (
          <img
            src={`http://localhost:5000${message.fileUrl}`}
            className="max-w-xs rounded"
          />
        )}  */}

        {/* IMAGE with Cloudinary */}
        {message.type === "image" && (
          <img src={message.fileUrl} alt="img" className="rounded max-w-xs" />
        )}

        {/* FILE  without Cloudinary*/}
        {/* {message.type === "file" && (
          <a
            href={`http://localhost:5000${message.fileUrl}`}
            target="_blank"
            className="underline text-blue-600"
          >
            📎 {message.fileName}
          </a>
        )} */}

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

        <div className="flex justify-end items-center gap-1 text-xs mt-1 opacity-70">
          <span>{time}</span>

          {isMe && (
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
