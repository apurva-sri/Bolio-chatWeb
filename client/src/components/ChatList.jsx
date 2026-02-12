import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const ChatList = ({ chats, setSelectedChat }) => {
  const { user, onlineUsers } = useAuth();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const getChatUser = (chat) => chat.users.find((u) => u._id !== user._id);

  /* =========================
     Search Function
     ========================= */
  const handleSearch = async () => {
    if (!search.trim()) return;

    try {
      setLoadingSearch(true);
      const { data } = await API.get(`/user?search=${search}`);
      setSearchResults(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSearch(false);
    }
  };

  /* =========================
     Access Chat Function
     ========================= */
  const accessChat = async (userId) => {
    try {
      const { data } = await API.post("/chat", { userId });

      setSelectedChat(data);
      setSearchResults([]);
      setSearch("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-1/3 border-r overflow-y-auto">
      <div className="p-2 border-b">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 border rounded px-2 py-1"
          />
          <button
            onClick={handleSearch}
            className="bg-black text-white px-3 rounded"
          >
            Go
          </button>
        </div>

        {loadingSearch && <p className="text-sm">Searching...</p>}

        {searchResults.map((user) => (
          <div
            key={user._id}
            onClick={() => accessChat(user._id)}
            className="cursor-pointer p-2 hover:bg-gray-200"
          >
            {user.username}
          </div>
        ))}
      </div>

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
