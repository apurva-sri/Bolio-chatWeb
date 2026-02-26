import React, { useEffect, useState, useCallback } from "react";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import Sidebar from "../components/Sidebar";
import WelcomeScreen from "../components/WelcomeScreen";
import API from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import usePushNotifications from "../hooks/usePushNotifications";

/* ─── Reminder Toast ─── */
const ReminderToast = ({ reminder, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[1000] bg-[#202c33] border border-[#00a884] rounded-xl p-4 shadow-2xl max-w-xs animate-pulse-once">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#00a884]/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#00a884]">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#00a884] text-xs font-bold uppercase tracking-wider mb-1">
          ⏰ Reminder
        </p>
        <p className="text-[#e9edef] text-sm font-semibold truncate">
          {reminder.title}
        </p>
        {reminder.content && (
          <p className="text-[#8696a0] text-xs mt-0.5 line-clamp-2">
            {reminder.content}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-[#8696a0] hover:text-[#e9edef] transition shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  </div>
);

/* ─── Accepted Request Toast (shown to User A when B accepts) ─── */
const AcceptedToast = ({ data, onClose, onOpen }) => (
  <div className="fixed bottom-20 right-6 z-[1000] bg-[#202c33] border border-[#00a884] rounded-xl p-4 shadow-2xl max-w-xs">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
        {data.acceptedBy?.avatar ? (
          <img
            src={data.acceptedBy.avatar}
            className="w-full h-full object-cover"
            alt=""
          />
        ) : (
          data.acceptedBy?.username?.[0]?.toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#e9edef] text-sm font-semibold">
          {data.acceptedBy?.username}
        </p>
        <p className="text-[#8696a0] text-xs">
          accepted your connection request
        </p>
        <button
          onClick={() => {
            onOpen(data.chat);
            onClose();
          }}
          className="mt-2 px-3 py-1 rounded-lg bg-[#00a884] text-white text-xs font-semibold hover:bg-[#02c197] transition"
        >
          Open chat →
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-[#8696a0] hover:text-[#e9edef] shrink-0"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  </div>
);

/* ─── Main Chat Page ─── */
const Chat = () => {
  const { user, setOnlineUsers } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [reminders, setReminders] = useState([]); // queue of reminders
  const [acceptedData, setAcceptedData] = useState(null);

  /* ── Register push notifications (safe — skips if no VAPID key) ── */
  usePushNotifications(user);

  /* ── Register user with socket AFTER user is loaded ── */
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("user-online", user._id);
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users", setOnlineUsers);
  }, [user?._id]);

  /* ── REMINDER socket event ──────────────────────────────────────
     This is the critical fix: we listen DIRECTLY on socket here.
     Before, the listener was correct but the toast state wasn't
     persisting because of stale closure issues.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user?._id) return;

    const handleReminder = (data) => {
      console.log("🔔 Reminder received:", data);
      // Add to queue so multiple reminders stack
      setReminders((prev) => [...prev, { ...data, id: Date.now() }]);
    };

    socket.on("reminder", handleReminder);
    return () => socket.off("reminder", handleReminder);
  }, [user?._id]);

  /* ── Friend request accepted → add chat to sidebar instantly ── */
  useEffect(() => {
    if (!user?._id) return;

    const handleAccepted = (data) => {
      const { chat, acceptedBy } = data;
      if (!chat) return;

      setChats((prev) => {
        const exists = prev.find((c) => c._id === chat._id);
        return exists ? prev : [chat, ...prev];
      });

      // Show toast only to the request sender (not the acceptor)
      if (acceptedBy?._id !== user._id) {
        setAcceptedData(data);
        setTimeout(() => setAcceptedData(null), 10_000);
      }
    };

    socket.on("friend-request-accepted", handleAccepted);
    return () => socket.off("friend-request-accepted", handleAccepted);
  }, [user?._id]);

  /* ── Load chats (only after user is available) ── */
  useEffect(() => {
    if (!user?._id) return;
    API.get("/chat")
      .then(({ data }) => setChats(data))
      .catch(console.error);
  }, [user?._id]);

  /* ── Add new chat from accepted request ── */
  const handleNewChat = useCallback((newChat) => {
    setChats((prev) => {
      const exists = prev.find((c) => c._id === newChat._id);
      return exists ? prev : [newChat, ...prev];
    });
  }, []);

  /* ── Dismiss a specific reminder from queue ── */
  const dismissReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#111b21] overflow-hidden">
      <Sidebar />

      {/* Chat list */}
      <div
        className={`
          ${selectedChat ? "hidden" : "flex"} md:flex
          w-full md:w-[340px] lg:w-[380px] flex-shrink-0
          flex-col border-r border-[#2a3942]
        `}
      >
        <ChatList
          chats={chats}
          setSelectedChat={setSelectedChat}
          selectedChat={selectedChat}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Chat area */}
      <div
        className={`${selectedChat ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}
      >
        {selectedChat ? (
          <ChatBox chat={selectedChat} onBack={() => setSelectedChat(null)} />
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Reminder toasts — stacked, newest on top */}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-3 items-end">
        {reminders.map((r) => (
          <ReminderToast
            key={r.id}
            reminder={r}
            onClose={() => dismissReminder(r.id)}
          />
        ))}
      </div>

      {/* Accepted request toast */}
      {acceptedData && (
        <AcceptedToast
          data={acceptedData}
          onClose={() => setAcceptedData(null)}
          onOpen={(chat) => {
            handleNewChat(chat);
            setSelectedChat(chat);
          }}
        />
      )}
    </div>
  );
};

export default Chat;
