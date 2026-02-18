import React, { useEffect, useState } from "react";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import API from "../utils/api";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import WelcomeScreen from "../components/WelcomeScreen";

const socket = io("http://localhost:5000");

const Chat = () => {
  const { user, setOnlineUsers } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (!user) return;
    socket.emit("user-online", user._id);
    socket.on("online-users", (users) => setOnlineUsers(users));
    return () => socket.off("online-users");
  }, [user]);

  useEffect(() => {
    const fetchChats = async () => {
      const { data } = await API.get("/chat");
      setChats(data);
    };
    fetchChats();
  }, []);

  return (
    <div className="flex h-screen bg-[#6b6d6e] overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          ${selectedChat ? "hidden" : "flex"} md:flex
          w-full md:w-[360px] lg:w-[400px] flex-shrink-0
          flex-col border-r border-[#bed9ea]
          bg-[#bed9ea]
        `}
      >
        <ChatList
          chats={chats}
          setSelectedChat={setSelectedChat}
          selectedChat={selectedChat}
        />
      </div>

      {/* Chat Area */}
      <div
        className={`
          ${selectedChat ? "flex" : "hidden"} md:flex
          flex-1 flex-col min-w-0
        `}
      >
        {selectedChat ? (
          <ChatBox chat={selectedChat} onBack={() => setSelectedChat(null)} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};


export default Chat;
