import React from "react";
import { useAuth } from "../context/AuthContext";

const Message = ({ message }) => {
  const { user } = useAuth();
  const isMe = message.sender._id === user._id;

  return (
    <div className={`mb-2 ${isMe ? "text-right" : "text-left"}`}>
      <span
        className={`inline-block px-3 py-2 rounded ${
          isMe ? "bg-black text-white" : "bg-gray-200"
        }`}
      >
        {message.content}
      </span>
    </div>
  );
};

export default Message;
