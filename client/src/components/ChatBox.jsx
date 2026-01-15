import React, { useEffect, useState } from "react";
import API from "../utils/api";
import Message from "./Message";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const ChatBox = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      const { data } = await API.get(`/message/${chat._id}`);
      setMessages(data);
      socket.emit("join-chat", chat._id);
    };

    fetchMessages();
  }, [chat]);

  useEffect(() => {
    socket.on("message-received", (message) => {
      setMessages((prev) => [...prev, message]);
    });
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data } = await API.post("/message", {
      content: newMessage,
      chatId: chat._id,
    });

    socket.emit("new-message", data);
    setMessages((prev) => [...prev, data]);
    setNewMessage("");
  };

  if (!chat)
    return (
      <div className="w-2/3 flex items-center justify-center">
        Select a chat
      </div>
    );

  return (
    <div className="w-2/3 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg._id} message={msg} />
        ))}
      </div>

      <div className="p-3 flex border-t">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border rounded px-3"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="ml-2 px-4 bg-black text-white">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
