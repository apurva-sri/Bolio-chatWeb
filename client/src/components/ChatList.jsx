//Left Sidebar
import React from "react";
import { useAuth } from "../context/AuthContext";

const ChatList = ({ chats, setSelectedChat }) => {
  const { user } = useAuth();

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    return chat.users.find((u) => u._id !== user._id)?.username;
  };

  return (
    <div className="w-1/3 border-r overflow-y-auto">
      {chats.length === 0 && <p className="p-4 text-gray-500">No chats yet</p>}

      {chats.map((chat) => (
        <div
          key={chat._id}
          onClick={() => setSelectedChat(chat)}
          className="p-4 cursor-pointer hover:bg-gray-100"
        >
          <p className="font-medium">{getChatName(chat)}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
