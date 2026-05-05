import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import * as api from '../services/api';

// Industrial Modular Components
import IconSidebar from '../components/chat/IconSidebar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ProfilePanel from '../components/chat/ProfilePanel';

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Navigation State
  const [activePanel, setActivePanel] = useState('chats');
  const [showProfile, setShowProfile] = useState(false);
  
  // Search & Requests State
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearch, setGlobalSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Messaging State
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const scrollRef = useRef();

  // Initial Data Fetching
  useEffect(() => {
    fetchChats();
    fetchRequests();
    fetchFriends();
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('message-received', (msg) => {
      if (selectedChat && (msg.chat._id === selectedChat._id || msg.chat === selectedChat._id)) {
        setMessages(prev => [...prev, msg]);
      }
      fetchChats();
    });

    socket.on('friend-request-received', () => {
      fetchRequests();
    });

    return () => {
      socket.off('message-received');
      socket.off('friend-request-received');
    };
  }, [socket, selectedChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── API HANDLERS ───
  const fetchChats = async () => {
    try {
      const { data } = await api.getAllChats();
      setChats(data.chats);
    } catch (err) { console.error(err); }
  };

  const fetchFriends = async () => {
    try {
      const { data } = await api.getFriends();
      setFriends(data.friends);
    } catch (err) { console.error(err); }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.getIncomingRequests();
      setPendingRequests(data.requests);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.length > 2 && globalSearch) {
      try {
        const { data } = await api.searchUsers(val);
        setSearchResults(data.users);
      } catch (err) { console.error(err); }
    } else {
      setSearchResults([]);
    }
  };

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setShowProfile(false);
    try {
      const { data } = await api.getMessages(chat._id);
      setMessages(data.messages);
      socket?.emit('join-chat', chat._id);
    } catch (err) { console.error(err); }
  };

  const startChatWithFriend = async (friendId) => {
    try {
      const { data } = await api.accessChat(friendId);
      // Data contains the chat object
      if (data.chat) {
        selectChat(data.chat);
        fetchChats(); // refresh list
      }
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const { data } = await api.sendMessage(selectedChat._id, newMessage);
      socket?.emit('send-message', data.message);
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      fetchChats();
    } catch (err) { console.error(err); }
  };

  const sendRequest = async (userId) => {
    try {
      await api.sendFriendRequest(userId);
      setGlobalSearch(false);
      setSearchTerm('');
      alert('Request sent!');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const acceptRequest = async (requestId) => {
    try {
      await api.acceptFriendRequest(requestId);
      fetchRequests();
      fetchChats();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="chat-layout">
      <IconSidebar 
        activePanel={activePanel} 
        setActivePanel={setActivePanel} 
        hasNotifications={pendingRequests.length > 0} 
      />

      <ChatSidebar 
        activePanel={activePanel}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        searchResults={searchResults}
        sendRequest={sendRequest}
        pendingRequests={pendingRequests}
        acceptRequest={acceptRequest}
        chats={chats}
        friends={friends}
        startChatWithFriend={startChatWithFriend}
        selectedChat={selectedChat}
        selectChat={selectChat}
        currentUser={user}
      />

      <ChatWindow 
        selectedChat={selectedChat}
        messages={messages}
        currentUser={user}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        scrollRef={scrollRef}
        toggleProfile={() => setShowProfile(!showProfile)}
      />

      <ProfilePanel 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={selectedChat?.users.find(u => u._id !== user?._id)}
      />
    </div>
  );
};

export default Chat;
