import React, { useEffect, useState, useRef } from "react";
import API from "../utils/api";
import Message from "./Message";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

const ChatBox = ({ chat, onBack }) => {
  const { user, onlineUsers } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyMessage, setReplyMessage] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  const otherUser = chat?.users?.find((u) => u._id !== user._id);
  const chatName = chat?.isGroupChat ? chat.chatName : otherUser?.username;
  const isOnline = !chat?.isGroupChat && onlineUsers?.includes(otherUser?._id);

  /* ======= FETCH + JOIN ======= */
  useEffect(() => {
    if (!chat) return;
    const fetchMessages = async () => {
      const { data } = await API.get(`/message/${chat._id}`);
      setMessages(data.filter((msg) => !msg.deletedFor?.includes(user._id)));
      await API.put(`/message/read/${chat._id}`);
      socket.emit("messages-read", { chatId: chat._id, userId: user._id });
    };
    fetchMessages();
    socket.emit("join-chat", chat._id);
    return () => socket.emit("leave-chat", chat._id);
  }, [chat, user._id]);

  /* ======= RECEIVE MESSAGES ======= */
  useEffect(() => {
    if (!chat) return;
    const handleMessage = async (message) => {
      if (!message?._id) return;
      setMessages((prev) => [...prev, message]);
      await API.put(`/message/delivered/${message._id}`);
      socket.emit("message-delivered", {
        chatId: chat._id,
        messageId: message._id,
        userId: user._id,
      });
      await API.put(`/message/read/${chat._id}`);
      socket.emit("messages-read", { chatId: chat._id, userId: user._id });
    };
    socket.on("message-received", handleMessage);
    return () => socket.off("message-received", handleMessage);
  }, [chat, user._id]);

  /* ======= SEEN ======= */
  useEffect(() => {
    const handleSeen = ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.sender?._id !== user._id) return msg;
          return {
            ...msg,
            deliveredTo: msg.deliveredTo?.includes(userId)
              ? msg.deliveredTo
              : [...(msg.deliveredTo || []), userId],
            readBy: msg.readBy?.includes(userId)
              ? msg.readBy
              : [...(msg.readBy || []), userId],
          };
        }),
      );
    };
    socket.on("messages-seen", handleSeen);
    return () => socket.off("messages-seen", handleSeen);
  }, [user._id]);

  /* ======= DELIVERED ======= */
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

  /* ======= DELETE ======= */
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

  /* ======= SCROLL ======= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ======= TYPING ======= */
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
    typingTimeoutRef.current = setTimeout(
      () => socket.emit("stop-typing", chat._id),
      1500,
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return;
    const { data } = await API.post("/message", {
      content: newMessage,
      chatId: chat._id,
      replyTo: replyMessage?._id || null,
    });
    setMessages((prev) => [...prev, data]);
    socket.emit("new-message", data);
    socket.emit("stop-typing", chat._id);
    setNewMessage("");
    setReplyMessage(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    e.target.value = "";
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.start();
    setIsRecording(true);
    timerRef.current = setInterval(
      () => setRecordingTime((prev) => prev + 1),
      1000,
    );
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

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full bg-[#0b141a]">
      {/* ====== HEADER ====== */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33] shadow-sm shrink-0">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="md:hidden w-8 h-8 rounded-full hover:bg-[#374045] flex items-center justify-center transition"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold overflow-hidden">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={chatName}
                className="w-full h-full object-cover"
              />
            ) : (
              chatName?.[0]?.toUpperCase()
            )}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#202c33]" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-[#e9edef] font-semibold text-sm leading-tight truncate">
            {chatName}
          </p>
          <p className="text-[#8696a0] text-xs">
            {isTyping ? (
              <span className="text-[#00a884]">typing...</span>
            ) : isOnline ? (
              "online"
            ) : (
              "last seen recently"
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {[
            <path
              key="search"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />,
            <path
              key="more"
              d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
            />,
          ].map((path, i) => (
            <button
              key={i}
              className="w-9 h-9 rounded-full hover:bg-[#374045] flex items-center justify-center transition"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
                {path}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ====== MESSAGES ====== */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "#0b141a",
        }}
      >
        {messages.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            setReplyMessage={setReplyMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ====== REPLY PREVIEW ====== */}
      {replyMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#202c33] border-l-4 border-[#00a884] mx-3 mb-1 rounded">
          <div className="min-w-0">
            <p className="text-[#00a884] text-xs font-medium mb-0.5">
              Replying to message
            </p>
            <p className="text-[#8696a0] text-sm truncate">
              {replyMessage.content}
            </p>
          </div>
          <button
            onClick={() => setReplyMessage(null)}
            className="ml-3 text-[#8696a0] hover:text-[#e9edef] transition shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* ====== INPUT BAR ====== */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#202c33] shrink-0">
        {!isRecording ? (
          <>
            {/* Emoji placeholder */}
            <button className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#8696a0]">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </button>

            {/* Attachment */}
            <button
              onClick={() => fileRef.current.click()}
              className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#8696a0]">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V6H9v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S6 2.79 6 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
              </svg>
            </button>
            <input type="file" hidden ref={fileRef} onChange={sendFile} />

            {/* Message input */}
            <input
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg px-4 py-2.5 text-sm outline-none min-w-0"
              placeholder="Type a message"
            />

            {/* Mic or Send */}
            {newMessage.trim() ? (
              <button
                onClick={sendMessage}
                className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center transition hover:bg-[#02c197] shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#8696a0]">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              </button>
            )}
          </>
        ) : (
          /* Recording UI */
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => {
                mediaRecorderRef.current?.stop();
                setIsRecording(false);
                clearInterval(timerRef.current);
                setRecordingTime(0);
              }}
              className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#ef4444]">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <div className="flex items-center gap-2 flex-1">
              <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full" />
              <div className="flex-1 bg-[#2a3942] rounded-full h-1">
                <div
                  className="bg-[#00a884] h-1 rounded-full transition-all"
                  style={{ width: `${Math.min(recordingTime * 2, 100)}%` }}
                />
              </div>
              <span className="text-[#8696a0] text-sm tabular-nums">
                {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:
                {String(recordingTime % 60).padStart(2, "0")}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center transition hover:bg-[#02c197] shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
