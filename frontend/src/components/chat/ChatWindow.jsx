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
  scrollRef, 
  toggleProfile 
}) => {
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

  return (
    <main className="chat-window">
      <header className="chat-topbar">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={toggleProfile}>
          <Avatar name={otherUser?.name} src={otherUser?.avatar} isOnline={otherUser?.isOnline} size="sm" />
          <div className="chat-topbar-info">
            <div className="chat-topbar-name">{otherUser?.name} {otherUser?.lastName}</div>
            <div className="chat-topbar-status">{otherUser?.isOnline ? 'Online' : 'Offline'}</div>
          </div>
        </div>
        <div className="chat-topbar-actions">
          <button className="topbar-btn"><Phone size={18} /></button>
          <button className="topbar-btn"><Video size={18} /></button>
          <button className="topbar-btn" onClick={toggleProfile}><Info size={18} /></button>
        </div>
      </header>

      <div className="messages-area">
        {messages.map((msg, i) => (
          <div key={msg._id || i} className={`msg-row ${msg.sender._id === currentUser?._id ? 'sent' : 'recv'}`}>
            <div className="msg-bubble">{msg.content}</div>
            <div className="msg-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form className="message-input-bar" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="msg-input" 
          placeholder="Type something..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="send-btn" type="submit" disabled={!newMessage.trim()}>
          <Send size={18} />
        </button>
      </form>
    </main>
  );
};

export default ChatWindow;
