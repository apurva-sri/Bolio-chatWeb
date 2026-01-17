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
    <div className="flex h-screen">
      <ChatList chats={chats} setSelectedChat={setSelectedChat} />
      <ChatBox chat={selectedChat} />
    </div>
  );
};

export default Chat;
