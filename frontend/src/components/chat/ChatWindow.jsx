import React from 'react';
import {
  Send, Phone, Video, Info, MessageSquare,
  Plus, Smile, Image, FileText, Camera, Zap,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import * as api from '../../services/api';
import Avatar from '../ui/Avatar';
import { useCall } from '../../context/CallContext';

const GIPHY_KEY = 'dc6zaTOxFJmzC'; // public beta key

const ChatWindow = ({
  selectedChat,
  messages,
  currentUser,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleTyping,
  isTyping,
  scrollRef,
  toggleProfile,
  onlineUsers = [],
  onLoadMore,
  hasMore,
  loadingMore,
  firstUnreadId,
}) => {
  const containerRef   = React.useRef();
  const fileInputRef   = React.useRef();
  const attachRef      = React.useRef();
  const emojiRef       = React.useRef();
  const { initiateCall } = useCall();

  const [showAttachMenu,  setShowAttachMenu]  = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showGifPicker,   setShowGifPicker]   = React.useState(false);
  const [gifSearch,       setGifSearch]       = React.useState('');
  const [gifs,            setGifs]            = React.useState([]);

  // ── Close all dropdowns when clicking outside ──────────────────────────────
  React.useEffect(() => {
    const onClickOutside = (e) => {
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachMenu(false);
        setShowGifPicker(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ── GIF fetching ───────────────────────────────────────────────────────────
  const fetchGifs = async (query = '') => {
    const endpoint = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${query}&limit=20`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20`;
    try {
      const res  = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data);
    } catch (err) {
      console.error('GIPHY fetch error', err);
    }
  };

  React.useEffect(() => { if (showGifPicker) fetchGifs(); }, [showGifPicker]);

  const handleGifSearch = (e) => {
    const val = e.target.value;
    setGifSearch(val);
    const id = setTimeout(() => fetchGifs(val), 500);
    return () => clearTimeout(id);
  };

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  React.useEffect(() => {
    if (scrollRef.current && !loadingMore) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  // ── Infinite scroll (load older messages) ─────────────────────────────────
  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      onLoadMore();
    }
  };

  // ── Emoji ──────────────────────────────────────────────────────────────────
  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleAttachmentClick = (type) => {
    setShowAttachMenu(false);
    fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const messageType = file.type.startsWith('image/') ? 'image' : 'file';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.uploadFile(formData);
      if (data.fileUrl) handleSendMessage(null, messageType, data.fileUrl);
    } catch (err) {
      console.error('Upload failed', err);
    }
    // Reset so the same file can be chosen again
    e.target.value = '';
  };

  // ── Date label ─────────────────────────────────────────────────────────────
  const formatDateLabel = (dateStr) => {
    const date      = new Date(dateStr);
    const today     = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString())     return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // ── Message list ───────────────────────────────────────────────────────────
  const renderMessages = () => {
    let lastDate = null;
    return messages.map((msg, i) => {
      const msgDate   = new Date(msg.createdAt).toDateString();
      const showDate  = msgDate !== lastDate;
      lastDate        = msgDate;
      const isSender  = msg.sender?._id === currentUser?._id;
      const isUnread  = msg._id === firstUnreadId;

      return (
        <React.Fragment key={msg._id || i}>
          {showDate && (
            <div className="date-divider">
              <span>{formatDateLabel(msg.createdAt)}</span>
            </div>
          )}
          {isUnread && (
            <div className="date-divider" style={{ color: 'var(--danger)' }}>
              <span style={{ background: 'var(--danger)', color: '#fff', padding: '2px 10px', borderRadius: 99 }}>
                Unread Messages
              </span>
            </div>
          )}

          <div className={`msg-row ${isSender ? 'sent' : 'recv'}`}>
            <div className={`msg-bubble ${isSender ? 'sent' : 'recv'}`}>

              {msg.messageType === 'image' ? (
                <div className="msg-image-wrap">
                  <img
                    src={`${import.meta.env.VITE_API_URL || ''}${msg.fileUrl}`}
                    alt="Sent"
                    className="msg-img-content"
                  />
                </div>
              ) : msg.messageType === 'file' ? (
                <a
                  href={`${import.meta.env.VITE_API_URL || ''}${msg.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="msg-file-content"
                >
                  <FileText size={20} />
                  <span>{msg.content || 'Document'}</span>
                </a>
              ) : (
                <div className="msg-text">{msg.content}</div>
              )}

              <div className="msg-footer">
                <span className="msg-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isSender && (
                  <span className="msg-status">
                    {msg.readBy?.some((u) => u !== currentUser?._id) ? '✓✓' : '✓'}
                  </span>
                )}
              </div>

            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!selectedChat) {
    return (
      <div className="empty-state">
        <MessageSquare size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h3>Your conversations will appear here</h3>
        <p>Select a friend from the sidebar to start chatting.</p>
      </div>
    );
  }

  const otherUser = selectedChat.users.find((u) => u._id !== currentUser?._id);
  const isOnline  = onlineUsers.includes(otherUser?._id);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="chat-window">

      {/* Top bar */}
      <header className="chat-topbar">
        <div className="chat-topbar-left" onClick={toggleProfile}>
          <Avatar name={otherUser?.name} src={otherUser?.avatar} isOnline={isOnline} size="sm" />
          <div className="chat-topbar-info">
            <div className="chat-topbar-name">{otherUser?.name} {otherUser?.lastName}</div>
            <div className={`chat-topbar-status ${isOnline ? 'online' : ''}`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="chat-topbar-actions">
          <button className="topbar-btn" onClick={() => initiateCall(otherUser, 'audio')} title="Voice call">
            <Phone size={18} />
          </button>
          <button className="topbar-btn" onClick={() => initiateCall(otherUser, 'video')} title="Video call">
            <Video size={18} />
          </button>
          <button className="topbar-btn" onClick={toggleProfile} title="Profile">
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="chat-messages-container" ref={containerRef} onScroll={handleScroll}>
        {loadingMore && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="loading-spin" style={{ margin: '0 auto', width: 16, height: 16 }} />
          </div>
        )}
        {renderMessages()}
        {isTyping && (
          <div className="msg-row recv">
            <div className="msg-bubble recv">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <footer className="chat-input-area">
        <div className="chat-input-container">

          {/* Attach button + menu */}
          <div ref={attachRef} style={{ position: 'relative' }}>
            <button
              className={`input-action-btn ${showAttachMenu ? 'active' : ''}`}
              onClick={() => setShowAttachMenu((v) => !v)}
              title="Attach"
            >
              <Plus size={20} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }} />
            </button>

            {showAttachMenu && (
              <div className="attachment-menu">
                <div className="attach-item" onClick={() => handleAttachmentClick('document')}>
                  <div className="attach-icon doc"><FileText size={18} /></div>
                  <span>Document</span>
                </div>
                <div className="attach-item" onClick={() => handleAttachmentClick('image')}>
                  <div className="attach-icon img"><Image size={18} /></div>
                  <span>Photos &amp; Videos</span>
                </div>
                <div className="attach-item" onClick={() => handleAttachmentClick('image')}>
                  <div className="attach-icon cam"><Camera size={18} /></div>
                  <span>Camera</span>
                </div>
                <div className="attach-item" onClick={() => setShowGifPicker((v) => !v)}>
                  <div className="attach-icon gif"><Zap size={18} /></div>
                  <span>GIF</span>
                </div>

                {showGifPicker && (
                  <div className="gif-picker-panel">
                    <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <input
                        type="text"
                        placeholder="Search GIPHY…"
                        className="gif-search-input"
                        value={gifSearch}
                        onChange={handleGifSearch}
                      />
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={() => setShowGifPicker(false)}
                      >
                        <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                      </button>
                    </div>
                    <div className="gif-grid">
                      {gifs.map((gif) => (
                        <img
                          key={gif.id}
                          src={gif.images.fixed_height_small.url}
                          alt="gif"
                          onClick={() => {
                            handleSendMessage(null, 'image', gif.images.original.url);
                            setShowGifPicker(false);
                            setShowAttachMenu(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Emoji button + picker */}
          <div ref={emojiRef} style={{ position: 'relative' }}>
            <button
              className={`input-action-btn ${showEmojiPicker ? 'active' : ''}`}
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="Emoji"
            >
              <Smile size={20} />
            </button>

            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
              </div>
            )}
          </div>

          {/* Text input + send */}
          <form
            onSubmit={handleSendMessage}
            style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}
          >
            <input
              type="text"
              placeholder="Type a message…"
              className="chat-input-field"
              value={newMessage}
              onChange={handleTyping}
            />
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="submit" className="send-btn-premium" title="Send">
              <Send size={18} />
            </button>
          </form>

        </div>
      </footer>

    </main>
  );
};

export default ChatWindow;
