import React from 'react';
import { Send, Phone, Video, Info, MessageSquare } from 'lucide-react';
import Avatar from '../ui/Avatar';

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
  firstUnreadId
}) => {
  const containerRef = React.useRef();

  // Handle scroll to load more
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;
    
    if (scrollTop === 0 && hasMore && !loadingMore) {
      onLoadMore();
    }
  };

  // Scroll to bottom on first load and new messages
  React.useEffect(() => {
    if (scrollRef.current && !loadingMore) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const renderMessages = () => {
    let lastDate = null;
    
    return messages.map((msg, i) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const showDivider = msgDate !== lastDate;
      lastDate = msgDate;
      
      const isUnreadStart = msg._id === firstUnreadId;
      
      return (
        <React.Fragment key={msg._id || i}>
          {showDivider && (
            <div className="date-divider">
              <span>{formatDateLabel(msg.createdAt)}</span>
            </div>
          )}
          {isUnreadStart && (
            <div className="date-divider unread-divider" style={{ color: 'var(--danger)' }}>
              <span style={{ background: 'var(--danger)', color: '#fff', padding: '2px 10px', borderRadius: '99px' }}>Unread Messages</span>
            </div>
          )}
          <div className={`msg-row ${msg.sender._id === currentUser?._id ? 'sent' : 'recv'}`}>
            <div className="msg-bubble">{msg.content}</div>
            <div className="msg-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  if (!selectedChat) {
    return (
      <div className="empty-state">
        <MessageSquare size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <h3>Your conversations will appear here</h3>
        <p>Select a friend from the sidebar to start chatting.</p>
      </div>
    );
  }

  const otherUser = selectedChat.users.find(u => u._id !== currentUser?._id);
  const isOnline = onlineUsers.includes(otherUser?._id);

  return (
    <main className="chat-window">
      <header className="chat-topbar">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={toggleProfile}>
          <Avatar name={otherUser?.name} src={otherUser?.avatar} isOnline={isOnline} size="sm" />
          <div className="chat-topbar-info">
            <div className="chat-topbar-name">{otherUser?.name} {otherUser?.lastName}</div>
            <div className={`chat-topbar-status ${isOnline ? 'online' : ''}`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="chat-topbar-actions">
          <button className="topbar-btn"><Phone size={18} /></button>
          <button className="topbar-btn"><Video size={18} /></button>
          <button className="topbar-btn" onClick={toggleProfile}><Info size={18} /></button>
        </div>
      </header>

      <div 
        className="messages-area" 
        ref={containerRef} 
        onScroll={handleScroll}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {loadingMore && (
          <div className="text-center py-2">
            <div className="loading-spin" style={{ margin: '0 auto', width: '16px', height: '16px' }} />
          </div>
        )}
        {renderMessages()}
        {isTyping && (
          <div className="msg-row recv">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form className="message-input-bar" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="msg-input" 
          placeholder="Type something..." 
          value={newMessage}
          onChange={handleTyping}
        />
        <button className="send-btn" type="submit" disabled={!newMessage.trim()}>
          <Send size={18} />
        </button>
      </form>
    </main>
  );
};

export default ChatWindow;
