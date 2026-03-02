import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import UserSearch from "./UserSearch";
import API from "../utils/api";
import socket from "../utils/socket";

const formatTime = (date) => {
  if (!date) return "";
  const d    = new Date(date);
  const now  = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7)   return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const lastMsgPreview = (msg, myId) => {
  if (!msg) return "";
  const sid  = typeof msg.sender === "object" ? msg.sender?._id : msg.sender;
  const isMe = sid?.toString() === myId?.toString();
  const pre  = isMe ? "You: " : "";
  if (msg.type === "deleted") return "🚫 This message was deleted";
  if (msg.type === "image")   return `${pre}📷 Photo`;
  if (msg.type === "audio")   return `${pre}🎵 Voice message`;
  if (msg.type === "file")    return `${pre}📄 Document`;
  return `${pre}${msg.content || ""}`;
};

const ChatList = ({ chats, setSelectedChat, selectedChat, onNewChat }) => {
  const { user, onlineUsers } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [localChats,   setLocalChats]   = useState(chats);
  const [unreadCounts, setUnreadCounts] = useState({}); // { chatId: number }

  /* Sync prop changes — merge to preserve real-time lastMessage updates */
  useEffect(() => {
    setLocalChats((prev) => {
      if (prev.length === 0) return chats; // first load
      // Merge: keep real-time lastMessage if newer than what prop has
      const merged = chats.map((c) => {
        const local = prev.find((p) => p._id === c._id);
        if (!local) return c;
        const localTime = local.lastMessage?.createdAt
          ? new Date(local.lastMessage.createdAt).getTime() : 0;
        const propTime  = c.lastMessage?.createdAt
          ? new Date(c.lastMessage.createdAt).getTime() : 0;
        return localTime > propTime ? local : c;
      });
      // Preserve local ordering (real-time bubbling)
      const propIds = new Set(chats.map((c) => c._id));
      const extra   = prev.filter((c) => !propIds.has(c._id));
      return [...extra, ...merged];
    });
  }, [chats]);

  /* ── Fetch unread counts on mount ── */
  useEffect(() => {
    if (!user?._id) return;
    API.get("/message/unread-counts")
      .then(({ data }) => setUnreadCounts(data))
      .catch(console.error);
  }, [user?._id]);

  /* ── Real-time: incoming message → update last msg + unread badge ── */
  useEffect(() => {
    if (!user?._id) return;

    const handle = (message) => {
      const chatId   = typeof message.chat === "object"
        ? message.chat._id?.toString() : message.chat?.toString();
      if (!chatId) return;

      const senderId = typeof message.sender === "object"
        ? message.sender?._id?.toString() : message.sender?.toString();
      const isFromMe = senderId === user._id.toString();

      /* Bubble chat to top + update last message */
      setLocalChats((prev) => {
        const idx = prev.findIndex((c) => c._id?.toString() === chatId);
        if (idx === -1) return prev;
        const updated   = [...prev];
        updated[idx]    = { ...updated[idx], lastMessage: message };
        const [moved]   = updated.splice(idx, 1);
        return [moved, ...updated];
      });

      /* Increment unread only for messages NOT from me, in non-active chat */
      if (!isFromMe) {
        const isActive = selectedChat?._id?.toString() === chatId;
        if (!isActive) {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1,
          }));
        }
      }
    };

    socket.on("message-received", handle);
    return () => socket.off("message-received", handle);
  }, [user?._id, selectedChat?._id]);

  /* ── Open chat → clear its unread badge ── */
  const openChat = useCallback((chat) => {
    setSelectedChat(chat);
    setUnreadCounts((prev) => ({ ...prev, [chat._id]: 0 }));
  }, [setSelectedChat]);

  /* ── New chat from accepted friend request ── */
  const handleNewChat = useCallback((chat) => {
    setLocalChats((prev) => {
      if (prev.find((c) => c._id === chat._id)) return prev;
      return [chat, ...prev];
    });
    onNewChat?.(chat);
  }, [onNewChat]);

  const filters  = ["All", "Unread", "Groups"];
  const filtered = localChats.filter((chat) => {
    if (activeFilter === "Groups") return chat.isGroupChat;
    if (activeFilter === "Unread") return (unreadCounts[chat._id] || 0) > 0;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold text-sm overflow-hidden cursor-pointer">
            {user?.avatar ? (
              <img src={user.avatar} alt="me" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
          </div>
          <span className="text-[#e9edef] font-semibold text-lg hidden sm:block">Chats</span>
        </div>
        <button className="w-9 h-9 rounded-full hover:bg-[#374045] flex items-center justify-center transition">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* ── Search ── */}
      <UserSearch
        onChatOpen={(chat) => {
          handleNewChat(chat);
          openChat(chat);
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

      {/* ── Chat Items ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#8696a0] px-4 text-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-20">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <p className="text-sm">No chats yet — search a username above to connect</p>
          </div>
        ) : (
          filtered.map((chat) => {
            const otherUser  = chat.users?.find((u) => u._id !== user._id);
            const name       = chat.isGroupChat ? chat.chatName : otherUser?.username;
            const avatar     = chat.isGroupChat ? null : otherUser?.avatar;
            const isOnline   = !chat.isGroupChat && onlineUsers?.includes(otherUser?._id);
            const isSelected = selectedChat?._id === chat._id;
            const lastMsg    = chat.lastMessage || chat.latestMessage;
            const unread     = unreadCounts[chat._id] || 0;
            const hasUnread  = unread > 0;

            return (
              <button
                key={chat._id}
                onClick={() => openChat(chat)}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#2a3942] transition text-left border-b border-[#2a3942]/50 ${
                  isSelected ? "bg-[#2a3942]" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#374045] flex items-center justify-center text-white font-semibold overflow-hidden">
                    {avatar
                      ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      : <span>{name?.[0]?.toUpperCase()}</span>}
                  </div>
                  {!chat.isGroupChat && isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[#e9edef] font-medium text-sm truncate">{name}</span>
                    <span className={`text-xs shrink-0 ${hasUnread ? "text-[#00a884]" : "text-[#8696a0]"}`}>
                      {formatTime(lastMsg?.createdAt || chat.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 gap-2">
                    <p className={`text-xs truncate ${hasUnread ? "text-[#e9edef] font-medium" : "text-[#8696a0]"}`}>
                      {lastMsgPreview(lastMsg, user._id) || "Start a conversation"}
                    </p>
                    {hasUnread && (
                      <span className="shrink-0 min-w-[20px] h-5 bg-[#00a884] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                        {unread > 99 ? "99+" : unread}
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
