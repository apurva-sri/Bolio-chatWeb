import React, { useEffect, useState, useRef } from "react";
import API from "../utils/api";
import Message from "./Message";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

const ChatBox = ({ chat }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      const { data } = await API.get(`/message/${chat._id}`);
      setMessages(data);

      // mark messages as read
      await API.put(`/message/read/${chat._id}`);
      socket.emit("messages-read", {
        chatId: chat._id,
        userId: user._id,
      });
    };

    fetchMessages();
    socket.emit("join-chat", chat._id);

    return () => {
      socket.emit("leave-chat", chat._id);
    };
  }, [chat]);

  /* =========================
     RECEIVE NEW MESSAGES
     ========================= */
  useEffect(() => {
    const handleMessage = (message) => {
      if (message.sender._id === user._id) return;
      setMessages((prev) => [...prev, message]);
    };

    socket.on("message-received", handleMessage);

    return () => {
      socket.off("message-received", handleMessage);
    };
  }, [user._id]);

  /* =========================
     AUTO SCROLL
     ========================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     TYPING INDICATOR (FIXED)
     ========================= */
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop-typing", () => setIsTyping(false));

    return () => {
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, []);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    socket.emit("typing", chat._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", chat._id);
    }, 1500);
  };

  /* =========================
     SEND MESSAGE
     ========================= */
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data } = await API.post("/message", {
      content: newMessage,
      chatId: chat._id,
    });

    setMessages((prev) => [...prev, data]); // sender optimistic UI
    socket.emit("new-message", data);
    socket.emit("stop-typing", chat._id);

    setNewMessage("");
  };

  if (!chat) {
    return (
      <div className="w-2/3 flex items-center justify-center">
        Select a chat
      </div>
    );
  }

  /* =========================
     mark messages as read
     ========================= */
  useEffect(() => {
    socket.on("messages-seen", ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender._id === user._id
            ? { ...msg, readBy: [...msg.readBy, userId] }
            : msg,
        ),
      );
    });

    return () => socket.off("messages-seen");
  }, [user._id]);

  return (
    <div className="w-2/3 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg._id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {isTyping && <p className="text-sm text-gray-500 px-4">typing...</p>}

      <div className="p-3 flex border-t">
        <input
          value={newMessage}
          onChange={handleTyping}
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
