import React from "react";
import { useAuth } from "../context/AuthContext";

const ChatList = ({ chats, setSelectedChat }) => {
  const { user, onlineUsers } = useAuth();

  const getChatUser = (chat) => chat.users.find((u) => u._id !== user._id);

  return (
    <div className="w-1/3 border-r overflow-y-auto">
      {chats.map((chat) => {
        const chatUser = getChatUser(chat);
        const isOnline = onlineUsers.includes(chatUser._id);

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedChat(chat)}
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-100"
          >
            {/* ONLINE DOT */}
            <div className="relative">
              <div className="w-10 h-10 bg-gray-300 rounded-full" />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            <div>
              <p className="font-medium">{chatUser.username}</p>
              <p className="text-xs text-gray-500">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
