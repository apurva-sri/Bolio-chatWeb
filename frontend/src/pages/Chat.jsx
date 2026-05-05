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
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
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
    fetchFriends();
    fetchRequests();
    fetchNotes();
    fetchReminders();
  }, []);

  const [isTyping, setIsTyping] = useState(false);
  const [typingChatId, setTypingChatId] = useState(null);
  const { onlineUsers } = useSocket();

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('message-received', (msg) => {
      const msgChatId = msg.chat?._id || msg.chat;
      if (selectedChat && (msgChatId === selectedChat._id)) {
        setMessages(prev => [...prev, msg]);
      }
      fetchChats();
    });

    socket.on('typing', (chatId) => {
      if (selectedChat?._id === chatId) setIsTyping(true);
    });

    socket.on('stop-typing', (chatId) => {
      if (selectedChat?._id === chatId) setIsTyping(false);
    });

    socket.on('friend-request-received', () => {
      fetchRequests();
    });

    socket.on('friend-request-was-accepted', () => {
      fetchFriends();
      fetchChats();
    });

    return () => {
      socket.off('message-received');
      socket.off('typing');
      socket.off('stop-typing');
      socket.off('friend-request-received');
      socket.off('friend-request-was-accepted');
    };
  }, [socket, selectedChat]);

  // Typing logic
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedChat) return;

    if (!typingChatId) {
      setTypingChatId(selectedChat._id);
      socket.emit('typing', selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= 3000 && typingChatId) {
        socket.emit('stop-typing', selectedChat._id);
        setTypingChatId(null);
      }
    }, 3000);
  };

  // ─── PRODUCTIVITY HANDLERS ───
  const fetchNotes = async () => {
    try {
      const { data } = await api.getNotes();
      setNotes(data.notes);
    } catch (err) { console.error(err); }
  };

  const fetchReminders = async () => {
    try {
      const { data } = await api.getReminders();
      setReminders(data.reminders);
    } catch (err) { console.error(err); }
  };

  const handleAddNote = async (note) => {
    try {
      await api.createNote(note);
      fetchNotes();
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      fetchNotes();
    } catch (err) { console.error(err); }
  };

  const handleAddReminder = async (reminder) => {
    try {
      await api.createReminder(reminder);
      fetchReminders();
    } catch (err) { console.error(err); }
  };

  const handleToggleReminder = async (id) => {
    try {
      await api.toggleReminder(id);
      fetchReminders();
    } catch (err) { console.error(err); }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await api.deleteReminder(id);
      fetchReminders();
    } catch (err) { console.error(err); }
  };

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
      socket?.emit('friend-request-sent', { 
        receiverId: userId, 
        senderData: user 
      });
      setGlobalSearch(false);
      setSearchTerm('');
      alert('Request sent!');
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const acceptRequest = async (requestId) => {
    try {
      const { data } = await api.acceptFriendRequest(requestId);
      socket?.emit('friend-request-accepted', {
        senderId: data.senderId,
        accepterData: user
      });
      fetchRequests();
      fetchChats();
      fetchFriends();
    } catch (err) { console.error(err); }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.rejectFriendRequest(requestId);
      fetchRequests();
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
        rejectRequest={rejectRequest}
        chats={chats}
        friends={friends}
        startChatWithFriend={startChatWithFriend}
        selectedChat={selectedChat}
        selectChat={selectChat}
        currentUser={user}
        onlineUsers={onlineUsers}
        notes={notes}
        reminders={reminders}
        handleAddNote={handleAddNote}
        handleDeleteNote={handleDeleteNote}
        handleAddReminder={handleAddReminder}
        handleToggleReminder={handleToggleReminder}
        handleDeleteReminder={handleDeleteReminder}
      />

      <ChatWindow 
        selectedChat={selectedChat}
        messages={messages}
        currentUser={user}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleTyping={handleTyping}
        isTyping={isTyping}
        scrollRef={scrollRef}
        toggleProfile={() => setShowProfile(!showProfile)}
        onlineUsers={onlineUsers}
      />

      <ProfilePanel 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={selectedChat?.users.find(u => u._id !== user?._id)}
        onlineUsers={onlineUsers}
      />
    </div>
  );
};

export default Chat;
