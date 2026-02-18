import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import ImagePreview from "./ImagePreview";

const Message = ({ message, setReplyMessage }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const senderId =
    typeof message.sender === "object" ? message.sender?._id : message.sender;
  const isMe = senderId === user._id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDelivered = message.deliveredTo?.length > 0;
  const isRead = message.readBy?.length > 1;

  const handleDelete = async (type) => {
    try {
      await API.put(`/message/delete/${type}/${message._id}`);
      setShowMenu(false);
    } catch (err) {
      console.log(err);
    }
  };

  if (message.type === "deleted") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
        <div
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs italic ${
            isMe ? "bg-[#1f2c34] text-[#8696a0]" : "bg-[#1e2a30] text-[#8696a0]"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          You deleted this message
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group relative`}
      onClick={() => showMenu && setShowMenu(false)}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-xl shadow-sm ${
          isMe
            ? "bg-[#005c4b] text-[#e9edef] rounded-br-sm"
            : "bg-[#1e2a30] text-[#e9edef] rounded-bl-sm"
        }`}
      >
        {/* ===== CONTENT ===== */}
        {message.type === "text" && (
          <div className="px-3 pt-2 pb-1">
            <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}

        {message.type === "image" && (
          <div
            className="rounded-xl overflow-hidden cursor-pointer"
            onClick={() => setShowPreview(true)}
          >
            <img
              src={message.fileUrl}
              alt="img"
              className="max-h-[300px] w-full object-cover"
            />
            {showPreview && (
              <ImagePreview
                imageUrl={message.fileUrl}
                onClose={() => setShowPreview(false)}
              />
            )}
          </div>
        )}

        {message.type === "file" && (
          <div
            className="flex items-center gap-3 px-3 py-3 cursor-pointer"
            onClick={() => window.open(message.fileUrl, "_blank")}
          >
            <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-[#e9edef]">
                {message.content}
              </p>
              <p className="text-xs text-[#8696a0]">
                {message.fileSize
                  ? `${(message.fileSize / 1024).toFixed(1)} KB · PDF`
                  : "Document"}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement("a");
                link.href = message.fileUrl;
                link.download = message.content;
                link.click();
              }}
              className="ml-auto shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-[#8696a0] hover:fill-[#e9edef] transition"
              >
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </button>
          </div>
        )}

        {message.type === "audio" && (
          <div className="px-3 py-2">
            <audio
              controls
              className="h-10 w-56 sm:w-64"
              style={{ filter: "invert(0.8) hue-rotate(150deg)" }}
            >
              <source src={message.fileUrl} type="audio/webm" />
            </audio>
          </div>
        )}

        {/* ===== TIME + TICKS ===== */}
        <div
          className={`flex items-center justify-end gap-1 text-[10px] text-[#8696a0] px-2 pb-1 ${
            message.type === "text" ? "mt-0" : "mt-1"
          }`}
        >
          <span>{time}</span>
          {isMe && (
            <span
              className={`text-base leading-none ${isRead ? "text-[#53bdeb]" : "text-[#8696a0]"}`}
            >
              {isDelivered ? (
                <svg
                  viewBox="0 0 16 11"
                  className="w-4 h-3 fill-current inline-block"
                >
                  <path d="M11.071.653a.45.45 0 0 0-.63 0L4.993 6.101 2.559 3.667a.45.45 0 0 0-.636.636l2.752 2.752a.45.45 0 0 0 .636 0l5.76-5.766a.45.45 0 0 0 0-.636zm2.265 0a.45.45 0 0 0-.636 0L7.258 6.095l-.87-.87a.45.45 0 0 0-.636.636l1.187 1.187a.45.45 0 0 0 .636 0l5.76-5.759a.45.45 0 0 0 0-.636z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 12 11"
                  className="w-3 h-3 fill-current inline-block"
                >
                  <path d="M10.071.653a.45.45 0 0 0-.63 0L3.993 6.101 1.559 3.667a.45.45 0 0 0-.636.636l2.752 2.752a.45.45 0 0 0 .636 0l5.76-5.766a.45.45 0 0 0 0-.636z" />
                </svg>
              )}
            </span>
          )}
        </div>

        {/* ===== 3-DOT MENU TRIGGER ===== */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={`absolute top-1 ${
            isMe ? "left-1" : "right-1"
          } opacity-0 group-hover:opacity-100 transition w-6 h-6 rounded-full bg-[#182229]/80 flex items-center justify-center`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#aebac1]">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>

        {/* ===== DROPDOWN ===== */}
        {showMenu && (
          <div
            className={`absolute ${
              isMe ? "right-0" : "left-0"
            } top-6 bg-[#233138] shadow-xl rounded-xl text-[#e9edef] text-sm z-50 min-w-[180px] border border-[#374045] overflow-hidden`}
          >
            <button
              onClick={() => {
                setReplyMessage(message);
                setShowMenu(false);
              }}
              className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-[#374045] transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#8696a0]">
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
              </svg>
              Reply
            </button>
            <button
              onClick={() => handleDelete("me")}
              className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-[#374045] transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#8696a0]">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Delete for me
            </button>
            {isMe && (
              <button
                onClick={() => handleDelete("everyone")}
                className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-[#374045] transition text-red-400"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
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
