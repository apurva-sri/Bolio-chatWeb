import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import UserSearch from "./UserSearch";

const ChatList = ({ chats, setSelectedChat, selectedChat, onNewChat }) => {
  const { user, onlineUsers } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Unread", "Groups"];

  const filtered = chats.filter((chat) => {
    if (activeFilter === "Groups") return chat.isGroupChat;
    if (activeFilter === "Unread") return chat.unreadCount > 0;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold text-sm overflow-hidden cursor-pointer">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="me"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
          </div>
          <span className="text-[#e9edef] font-semibold text-lg hidden sm:block">
            Chats
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-full hover:bg-[#374045] flex items-center justify-center transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── UserSearch replaces plain search input ── */}
      <UserSearch
        onChatOpen={(chat) => {
          onNewChat?.(chat); // bubble up to Chat.jsx to add to list
          setSelectedChat(chat); // open immediately
        }}
      />

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 px-4 py-1 rounded-full text-sm font-medium transition ${
              activeFilter === f
                ? "bg-[#00a884] text-white"
                : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Chat List ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#8696a0] px-4 text-center">
            <svg
              viewBox="0 0 24 24"
              className="w-10 h-10 fill-current opacity-20"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <p className="text-sm">
              No chats yet — search a username above to connect
            </p>
          </div>
        ) : (
          filtered.map((chat) => {
            const otherUser = chat.users?.find((u) => u._id !== user._id);
            const name = chat.isGroupChat ? chat.chatName : otherUser?.username;
            const avatar = chat.isGroupChat ? null : otherUser?.avatar;
            const initials = name?.[0]?.toUpperCase();
            const isOnline = onlineUsers?.includes(otherUser?._id);
            const isSelected = selectedChat?._id === chat._id;
            const lastMsg = chat.lastMessage || chat.latestMessage;

            return (
              <button
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2a3942] transition text-left border-b border-[#2a3942]/50 ${
                  isSelected ? "bg-[#2a3942]" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold overflow-hidden">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  {!chat.isGroupChat && isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#e9edef] font-medium text-sm truncate">
                      {name}
                    </span>
                    {lastMsg && (
                      <span className="text-[#8696a0] text-xs shrink-0 ml-2">
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[#8696a0] text-xs truncate">
                      {lastMsg?.type === "deleted"
                        ? "🚫 This message was deleted"
                        : lastMsg?.type === "image"
                          ? "📷 Photo"
                          : lastMsg?.type === "audio"
                            ? "🎵 Voice message"
                            : lastMsg?.type === "file"
                              ? "📄 Document"
                              : lastMsg?.content || "Start a conversation"}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="shrink-0 ml-2 bg-[#00a884] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
