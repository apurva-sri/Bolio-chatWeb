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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyMessage, setReplyMessage] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null); // REQUIRED for audio sending
  const audioChunksRef = useRef([]); // REQUIRED for audio sending
  const fileRef = useRef(null); // REQUIRED for file sending
  const timerRef = useRef(null);
  /* =========================
     FETCH + JOIN CHAT
     ========================= */
  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      const { data } = await API.get(`/message/${chat._id}`);
      const filtered = data.filter(
        (msg) => !msg.deletedFor?.includes(user._id),
      );
      setMessages(filtered);

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
     DELETE MESSAGE
     ========================= */
  useEffect(() => {
    const handleDelete = ({ messageId, type }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId && type === "everyone"
            ? { ...msg, type: "deleted" }
            : msg,
        ),
      );
    };

    socket.on("message-deleted", handleDelete);
    return () => socket.off("message-deleted", handleDelete);
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
      replyTo: replyMessage?._id || null,
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

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorder.start();
    setIsRecording(true);

    // ⏱ Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };


  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");
      formData.append("chatId", chat._id);

      const { data } = await API.post("/message", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) => [...prev, data]);
      socket.emit("new-message", data);

      setRecordingTime(0);
    };
  };


  /* =========================
     UI
     ========================= */
  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500 text-lg">Select a chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/*CHAT HEADER */}
      <div className="p-4 border-b font-semibold bg-white shadow-sm">
        {chat.isGroupChat
          ? chat.chatName
          : chat.users.find((u) => u._id !== user._id)?.username}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-[#efeae2]">
        {messages.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            setReplyMessage={setReplyMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isTyping && <p className="text-sm text-gray-500 px-4">typing...</p>}

      <div className="p-3 flex items-center border-t gap-2 bg-white">
        <button onClick={() => fileRef.current.click()}>📎</button>
        {!isRecording ? (
          <button onClick={startRecording}>🎤</button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-red-500 animate-pulse">🔴 Recording</span>
            <span>{recordingTime}s</span>

            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-2 rounded"
            >
              Stop
            </button>
          </div>
        )}

        {replyMessage && (
          <div className="px-4 py-2 bg-gray-100 text-sm flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-xs">Replying to:</p>
              <p className="truncate">{replyMessage.content}</p>
            </div>
            <button onClick={() => setReplyMessage(null)}>❌</button>
          </div>
        )}

        <input type="file" hidden ref={fileRef} onChange={sendFile} />
        <input
          value={newMessage}
          onChange={handleTyping}
          className="flex-1 border rounded-full px-4 py-2 outline-none text-sm"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="px-4 bg-black text-white">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
