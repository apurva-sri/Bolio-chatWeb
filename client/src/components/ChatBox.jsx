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
  const fileRef = useRef(null); // REQUIRED for file sending

  /* =========================
     FETCH + JOIN CHAT
     ========================= */
  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      const { data } = await API.get(`/message/${chat._id}`);
      setMessages(data);

      // mark messages as read (chat open)
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
  }, [chat, user._id]);

  /* =========================
     RECEIVE NEW MESSAGES
     ========================= */
  useEffect(() => {
    if (!chat) return;

    const handleMessage = async (message) => {
      if (!message || !message._id) return;

      // Add message to UI
      setMessages((prev) => [...prev, message]);

      // MARK AS DELIVERED
      await API.put(`/message/delivered/${message._id}`);
      socket.emit("message-delivered", {
        chatId: chat._id,
        messageId: message._id,
        userId: user._id,
      });

      // read (because chat is open)
      await API.put(`/message/read/${chat._id}`);
      socket.emit("messages-read", {
        chatId: chat._id,
        userId: user._id,
      });
    };

    socket.on("message-received", handleMessage);
    return () => socket.off("message-received", handleMessage);
  }, [chat, user._id]);

  /* =========================
     MESSAGES SEEN (✓✓)
     ========================= */
  useEffect(() => {
    const handleSeen = ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          // only sender messages
          if (msg.sender?._id !== user._id) return msg;

          const deliveredTo = msg.deliveredTo || [];
          const readBy = msg.readBy || [];

          return {
            ...msg,
            // READ implies DELIVERED
            deliveredTo: deliveredTo.includes(userId)
              ? deliveredTo
              : [...deliveredTo, userId],

            readBy: readBy.includes(userId) ? readBy : [...readBy, userId],
          };
        }),
      );
    };

    socket.on("messages-seen", handleSeen);
    return () => socket.off("messages-seen", handleSeen);
  }, [user._id]);

  /* =========================
     Delivered socket listener
     ========================= */

  useEffect(() => {
    const handleDelivered = ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                deliveredTo: msg.deliveredTo?.includes(userId)
                  ? msg.deliveredTo
                  : [...(msg.deliveredTo || []), userId],
              }
            : msg,
        ),
      );
    };

    socket.on("message-delivered", handleDelivered);
    return () => socket.off("message-delivered", handleDelivered);
  }, []);

  /* =========================
     AUTO SCROLL
     ========================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     TYPING INDICATOR
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

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", chat._id);
    }, 1500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return;

    const { data } = await API.post("/message", {
      content: newMessage,
      chatId: chat._id,
    });
    // sender optimistic UI
    setMessages((prev) => [...prev, data]);
    socket.emit("new-message", data);
    socket.emit("stop-typing", chat._id);
    setNewMessage("");
  };

  /* =========================
     SEND FILE / IMAGE
     ========================= */
  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chat._id);

    const { data } = await API.post("/message", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setMessages((prev) => [...prev, data]);
    socket.emit("new-message", data);
  };

  /* =========================
     UI
     ========================= */
  if (!chat) {
    return (
      <div className="w-2/3 flex items-center justify-center">
        Select a chat
      </div>
    );
  }

  return (
    <div className="w-2/3 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <Message key={msg._id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {isTyping && <p className="text-sm text-gray-500 px-4">typing...</p>}

      <div className="p-3 flex border-t gap-2">
        <button onClick={() => fileRef.current.click()}>📎</button>
        <input type="file" hidden ref={fileRef} onChange={sendFile} />

        <input
          value={newMessage}
          onChange={handleTyping}
          className="flex-1 border rounded px-3"
          placeholder="Type a message..."
        />

        <button onClick={sendMessage} className="px-4 bg-black text-white">
          Send
        </button>
      </div>
    </div>
  );
};;

export default ChatBox;
