import React, { useEffect, useState } from "react";
import API from "../utils/api";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

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
