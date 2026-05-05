import React from 'react';
import { Search, Plus, ChevronLeft, Check } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const ChatSidebar = ({ 
  activePanel, 
  globalSearch, 
  setGlobalSearch, 
  searchTerm, 
  handleSearch, 
  searchResults, 
  sendRequest, 
  pendingRequests, 
  acceptRequest, 
  chats, 
  selectedChat, 
  selectChat, 
  currentUser 
}) => {
  return (
    <section className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>{globalSearch ? 'Discovery' : 'Messages'}</h2>
        <Button 
          variant={globalSearch ? 'secondary' : 'primary'}
          size="sm"
          className="mb-3"
          icon={globalSearch ? ChevronLeft : Plus}
          onClick={() => setGlobalSearch(!globalSearch)}
        >
          {globalSearch ? 'Back to Chats' : 'Create New'}
        </Button>
        
        <div className="search-input-wrap">
          <Search size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder={globalSearch ? "Search people globally..." : "Search friends..."} 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="chat-list">
        {globalSearch ? (
          searchResults.length > 0 ? (
            searchResults.map(u => (
              <div key={u._id} className="chat-item">
                <Avatar name={u.username} size="sm" />
                <div className="chat-item-info">
                  <div className="chat-item-name">@{u.username}</div>
                  <div className="chat-item-preview">{u.name} {u.lastName}</div>
                </div>
                <Button size="sm" variant="success" onClick={() => sendRequest(u._id)}>Add</Button>
              </div>
            ))
          ) : searchTerm.length > 2 ? <p className="text-muted">No users found</p> : null
        ) : activePanel === 'people' ? (
          pendingRequests.length > 0 ? (
            pendingRequests.map(req => (
              <div key={req._id} className="chat-item">
                <Avatar name={req.sender.username} size="sm" />
                <div className="chat-item-info">
                  <div className="chat-item-name">@{req.sender.username}</div>
                  <div className="chat-item-preview">Incoming Friend Request</div>
                </div>
                <Button variant="success" size="sm" onClick={() => acceptRequest(req._id)}>
                  <Check size={14} />
                </Button>
              </div>
            ))
          ) : <p className="text-muted">No pending requests</p>
        ) : (
          chats.length > 0 ? (
            chats.map(chat => {
              const otherUser = chat.users.find(u => u._id !== currentUser?._id);
              return (
                <div 
                  key={chat._id} 
                  className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => selectChat(chat)}
                >
                  <Avatar 
                    name={otherUser?.name} 
                    src={otherUser?.avatar} 
                    isOnline={otherUser?.isOnline} 
                  />
                  <div className="chat-item-info">
                    <div className="chat-item-name">{otherUser?.name} {otherUser?.lastName}</div>
                    <div className="chat-item-preview">
                      {chat.latestMessage?.content || 'Tap to start chatting'}
                    </div>
                  </div>
                  {chat.latestMessage && (
                    <div className="chat-item-meta">
                      <div className="chat-item-time">
                        {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : <p className="text-muted">No conversations yet</p>
        )}
      </div>
    </section>
  );
};

export default ChatSidebar;
