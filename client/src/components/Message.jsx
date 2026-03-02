import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import ImagePreview from "./ImagePreview";

/* ── Smart image component — sizes bubble to match image aspect ratio ── */
const SmartImage = ({ src, onClick }) => {
  const [dims, setDims] = useState(null); // { w, h, ratio }

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      // Classify: landscape / portrait / square / tiny
      setDims({ w: img.naturalWidth, h: img.naturalHeight, ratio });
    };
    img.src = src;
  }, [src]);

  if (!dims) {
    // Placeholder while loading — fixed 260×180
    return (
      <div
        className="bg-[#182229] animate-pulse cursor-pointer"
        style={{ width: 260, height: 180 }}
        onClick={onClick}
      />
    );
  }

  /* ── Compute display size ──────────────────────────────────────
     Rules (matching WhatsApp behaviour):
     - Max width  : 280px
     - Max height : 320px
     - Min width  : 140px  (tiny images still get reasonable size)
     - Min height : 100px
     Natural aspect ratio is preserved within these bounds.
  ─────────────────────────────────────────────────────────────── */
  const MAX_W = 280,
    MAX_H = 320,
    MIN_W = 140,
    MIN_H = 100;
  let dispW = dims.w;
  let dispH = dims.h;

  // Scale down if too large
  if (dispW > MAX_W) {
    dispH = dispH * (MAX_W / dispW);
    dispW = MAX_W;
  }
  if (dispH > MAX_H) {
    dispW = dispW * (MAX_H / dispH);
    dispH = MAX_H;
  }
  // Scale up if too small
  if (dispW < MIN_W) {
    dispH = dispH * (MIN_W / dispW);
    dispW = MIN_W;
  }
  if (dispH < MIN_H) {
    dispW = dispW * (MIN_H / dispH);
    dispH = MIN_H;
  }

  // Final clamp
  dispW = Math.min(Math.max(Math.round(dispW), MIN_W), MAX_W);
  dispH = Math.min(Math.max(Math.round(dispH), MIN_H), MAX_H);

  return (
    <img
      src={src}
      alt="img"
      onClick={onClick}
      className="block cursor-pointer object-cover"
      style={{ width: dispW, height: dispH }}
    />
  );
};

const Message = ({ message, setReplyMessage }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const menuRef = useRef(null);

  const senderId =
    typeof message.sender === "object" ? message.sender?._id : message.sender;
  const isMe = senderId === user._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDelivered = message.deliveredTo?.length > 0;
  const isRead = message.readBy?.some(
    (id) =>
      (typeof id === "object" ? id._id || id : id).toString() !==
      user._id.toString(),
  );

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleDelete = async (type) => {
    try {
      await API.put(`/message/delete/${type}/${message._id}`);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Deleted bubble ── */
  if (message.type === "deleted") {
    return (
      <div
        className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 px-2`}
      >
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs italic bg-[#1e2a30] text-[#8696a0]">
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 fill-current shrink-0"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          This message was deleted
        </div>
      </div>
    );
  }

  /* ── Reply block inside bubble ── */
  const ReplyBlock = () => {
    const reply = message.replyTo;
    if (!reply) return null;

    const replyFromId =
      typeof reply.sender === "object"
        ? reply.sender?._id?.toString()
        : reply.sender?.toString();
    const isReplyFromMe = replyFromId === user._id.toString();
    const replyName = isReplyFromMe
      ? "You"
      : (typeof reply.sender === "object" ? reply.sender?.username : null) ||
        "Unknown";
    const accentColor = isReplyFromMe ? "#00a884" : "#53bdeb";
    const replyText =
      reply.type === "image"
        ? "📷 Photo"
        : reply.type === "audio"
          ? "🎵 Voice message"
          : reply.type === "file"
            ? `📄 ${reply.content || "Document"}`
            : reply.type === "deleted"
              ? "This message was deleted"
              : reply.content || "";

    const scrollToOriginal = () => {
      const el = document.getElementById(`msg-${reply._id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background 0.3s";
      el.style.background = "rgba(0,168,132,0.2)";
      setTimeout(() => (el.style.background = ""), 1400);
    };

    return (
      <div
        onClick={scrollToOriginal}
        className="flex rounded-lg overflow-hidden mb-1 mt-1 mx-1 cursor-pointer active:opacity-80 transition-opacity"
        style={{
          backgroundColor: isMe ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="w-[3.5px] shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex-1 min-w-0 px-2.5 py-1.5">
          <p
            className="text-[11px] font-semibold mb-0.5 truncate"
            style={{ color: accentColor }}
          >
            {replyName}
          </p>
          {reply.type === "image" && reply.fileUrl ? (
            <div className="flex items-center gap-2">
              <p className="text-[#8696a0] text-xs flex-1 truncate">📷 Photo</p>
              <img
                src={reply.fileUrl}
                alt="reply"
                className="w-9 h-9 object-cover rounded shrink-0"
              />
            </div>
          ) : (
            <p className="text-[#8696a0] text-[12px] line-clamp-2 break-words">
              {replyText}
            </p>
          )}
        </div>
      </div>
    );
  };

  /* ── Ticks ── */
  const DoubleTick = () => (
    <svg
      viewBox="0 0 16 11"
      className="w-4 h-[11px] fill-current inline-block shrink-0"
    >
      <path d="M11.071.653a.45.45 0 0 0-.63 0L4.993 6.101 2.559 3.667a.45.45 0 0 0-.636.636l2.752 2.752a.45.45 0 0 0 .636 0l5.76-5.766a.45.45 0 0 0 0-.636zm2.265 0a.45.45 0 0 0-.636 0L7.258 6.095l-.87-.87a.45.45 0 0 0-.636.636l1.187 1.187a.45.45 0 0 0 .636 0l5.76-5.759a.45.45 0 0 0 0-.636z" />
    </svg>
  );
  const SingleTick = () => (
    <svg
      viewBox="0 0 12 11"
      className="w-3 h-[11px] fill-current inline-block shrink-0"
    >
      <path d="M10.071.653a.45.45 0 0 0-.63 0L3.993 6.101 1.559 3.667a.45.45 0 0 0-.636.636l2.752 2.752a.45.45 0 0 0 .636 0l5.76-5.766a.45.45 0 0 0 0-.636z" />
    </svg>
  );

  /* ── Meta row (time + ticks) ── */
  const MetaRow = ({ overlap = false }) => (
    <div
      className={`flex items-center justify-end gap-[3px] ${
        overlap
          ? "absolute bottom-1.5 right-2 bg-black/40 rounded-full px-1.5 py-0.5"
          : "px-2 pb-1 pt-0.5"
      }`}
    >
      <span className="text-[10px] text-[#8696a0] leading-none whitespace-nowrap">
        {time}
      </span>
      {isMe && (
        <span className={isRead ? "text-[#53bdeb]" : "text-[#8696a0]"}>
          {isDelivered ? <DoubleTick /> : <SingleTick />}
        </span>
      )}
    </div>
  );

  return (
    <div
      id={`msg-${message._id}`}
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group relative px-2`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-xl shadow-sm overflow-hidden ${
          isMe
            ? "bg-[#005c4b] text-[#e9edef] rounded-br-sm"
            : "bg-[#1e2a30] text-[#e9edef] rounded-bl-sm"
        }`}
      >
        {/* Reply block */}
        {message.replyTo && <ReplyBlock />}

        {/* ── TEXT ── */}
        {message.type === "text" && (
          <div className="px-3 pt-2 pb-1">
            <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
              {/* Invisible spacer so time never overlaps last line of text */}
              <span className="inline-block w-14 h-3 align-bottom" />
            </p>
            <MetaRow />
          </div>
        )}

        {/* ── IMAGE — smart sizing ── */}
        {message.type === "image" && (
          <div className="relative overflow-hidden rounded-xl">
            <SmartImage
              src={message.fileUrl}
              onClick={() => setShowPreview(true)}
            />
            <MetaRow overlap />
            {showPreview && (
              <ImagePreview
                imageUrl={message.fileUrl}
                onClose={() => setShowPreview(false)}
              />
            )}
          </div>
        )}

        {/* ── FILE ── */}
        {message.type === "file" && (
          <>
            <div
              className="flex items-center gap-3 px-3 py-3 cursor-pointer"
              onClick={() => window.open(message.fileUrl, "_blank")}
            >
              <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {message.content}
                </p>
                <p className="text-xs text-[#8696a0]">
                  {message.fileSize
                    ? `${(message.fileSize / 1024).toFixed(1)} KB`
                    : "Document"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement("a");
                  a.href = message.fileUrl;
                  a.download = message.content;
                  a.click();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-[#8696a0] hover:fill-[#e9edef] transition"
                >
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
              </button>
            </div>
            <MetaRow />
          </>
        )}

        {/* ── AUDIO ── */}
        {message.type === "audio" && (
          <>
            <div className="px-3 py-2">
              <audio
                controls
                className="h-10 w-56 sm:w-64"
                style={{ filter: "invert(0.8) hue-rotate(150deg)" }}
              >
                <source src={message.fileUrl} type="audio/webm" />
              </audio>
            </div>
            <MetaRow />
          </>
        )}

        {/* ── 3-dot menu trigger ── */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
          className={`absolute top-1 ${
            isMe ? "left-1" : "right-1"
          } opacity-0 group-hover:opacity-100 transition w-6 h-6 rounded-full bg-[#182229]/80 flex items-center justify-center z-10`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#aebac1]">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>

        {/* ── Dropdown ── */}
        {showMenu && (
          <div
            ref={menuRef}
            className={`absolute ${
              isMe ? "right-0" : "left-0"
            } top-7 bg-[#233138] shadow-2xl rounded-xl text-[#e9edef] text-sm z-50 min-w-[170px] border border-[#374045] overflow-hidden`}
          >
            <button
              onClick={() => {
                setReplyMessage(message);
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-[#374045] transition"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-[#8696a0] shrink-0"
              >
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
              </svg>
              Reply
            </button>
            <button
              onClick={() => handleDelete("me")}
              className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-[#374045] transition"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-[#8696a0] shrink-0"
              >
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Delete for me
            </button>
            {isMe && (
              <button
                onClick={() => handleDelete("everyone")}
                className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-[#374045] transition text-red-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-current shrink-0"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Delete for everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
