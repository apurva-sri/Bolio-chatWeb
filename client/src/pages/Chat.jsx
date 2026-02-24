import React, { useEffect, useState } from "react";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import Sidebar from "../components/Sidebar";
import WelcomeScreen from "../components/WelcomeScreen";
import API from "../utils/api";
import socket from "../utils/socket"; 
import { useAuth } from "../context/AuthContext";

const ReminderToast = ({ reminder, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[1000] bg-[#202c33] border border-[#00a884] rounded-xl p-4 shadow-2xl max-w-xs animate-fade-in">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#00a884]/20 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#00a884]">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#00a884] text-xs font-semibold uppercase tracking-wide mb-0.5">
          Reminder
        </p>
        <p className="text-[#e9edef] text-sm font-medium truncate">
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

const Chat = () => {
  const { user, setOnlineUsers } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [reminder, setReminder] = useState(null);

  /* ── Register user with socket + online list ── */
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("user-online", user._id);
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users", setOnlineUsers);
  }, [user?._id]);

  /* ── Reminder notifications ── */
  useEffect(() => {
    const handle = (data) => {
      setReminder(data);
      setTimeout(() => setReminder(null), 8000);
    };
    socket.on("reminder", handle);
    return () => socket.off("reminder", handle);
  }, []);

  /* ── Load chats on mount ── */
  useEffect(() => {
    if (!user?._id) return;
    API.get("/chat")
      .then(({ data }) => setChats(data))
      .catch(console.error);
  }, [user?._id]);

  /* ── Add new chat (from accepted request) without refetch ── */
  const handleNewChat = (newChat) => {
    setChats((prev) => {
      const exists = prev.find((c) => c._id === newChat._id);
      return exists ? prev : [newChat, ...prev];
    });
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

      {reminder && (
        <ReminderToast reminder={reminder} onClose={() => setReminder(null)} />
      )}
    </div>
  );
};

export default Chat;
