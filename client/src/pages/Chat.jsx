import React, { useEffect, useState } from "react";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import API from "../utils/api";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

const Chat = () => {
  const { user, setOnlineUsers } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (!user) return;

    socket.emit("user-online", user._id);

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online-users");
    };
  }, [user]);

  useEffect(() => {
    const fetchChats = async () => {
      const { data } = await API.get("/chat");
      setChats(data);
    };

    fetchChats();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-1/3 lg:w-1/4 border-r bg-yellow-50">
        <ChatList chats={chats} setSelectedChat={setSelectedChat} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatBox chat={selectedChat} />
      </div>
    </div>
  );
};

export default Chat;
