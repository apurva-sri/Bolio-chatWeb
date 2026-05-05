import React, { useState } from 'react';
import { Search, Plus, ChevronLeft, Check, X, Calendar as CalIcon, StickyNote, Clock, Trash2, ChevronRight } from 'lucide-react';
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
  rejectRequest,
  chats, 
  friends,
  startChatWithFriend,
  selectedChat, 
  selectChat, 
  currentUser,
  onlineUsers = [],
  notes = [],
  reminders = [],
  handleAddNote,
  handleDeleteNote,
  handleAddReminder,
  handleToggleReminder,
  handleDeleteReminder
}) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: '#fef3c7' });
  
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: '', dueDate: '', priority: 'medium' });

  const onSubmitNote = (e) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.content) return;
    handleAddNote(noteForm);
    setNoteForm({ title: '', content: '', color: '#fef3c7' });
    setShowNoteForm(false);
  };

  const onSubmitReminder = (e) => {
    e.preventDefault();
    if (!reminderForm.title || !reminderForm.dueDate) return;
    handleAddReminder(reminderForm);
    setReminderForm({ title: '', dueDate: '', priority: 'medium' });
    setShowReminderForm(false);
  };

  // Simple Calendar Logic
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();
  
  return (
    <section className="chat-sidebar">
      <div className="chat-sidebar-header">
        <div className="flex items-center justify-between mb-3">
          <h2>{
            activePanel === 'calendar' ? 'Calendar' : 
            activePanel === 'notes' ? 'My Notes' : 
            globalSearch ? 'Discovery' : 'Messages'
          }</h2>
          
          {(activePanel === 'notes' || activePanel === 'calendar') && (
            <button 
              className="icon-btn sm" 
              onClick={() => activePanel === 'notes' ? setShowNoteForm(!showNoteForm) : setShowReminderForm(!showReminderForm)}
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: '8px' }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {activePanel === 'chats' && (
          <>
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
          </>
        )}
      </div>

      <div className="chat-list">
        {/* ─── SEARCH & CHATS PANEL ─── */}
        {activePanel === 'chats' && (
          <>
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
              ) : searchTerm.length > 2 ? <p className="text-muted p-4">No users found</p> : null
            ) : (
              <>
                {chats.length > 0 ? (
                  chats.map(chat => {
                    const otherUser = chat.users.find(u => u._id !== currentUser?._id);
                    const isOnline = onlineUsers.includes(otherUser?._id);
                    return (
                      <div 
                        key={chat._id} 
                        className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                        onClick={() => selectChat(chat)}
                      >
                        <Avatar name={otherUser?.name} src={otherUser?.avatar} isOnline={isOnline} />
                        <div className="chat-item-info">
                          <div className="chat-item-name">{otherUser?.name} {otherUser?.lastName}</div>
                          <div className="chat-item-preview">{chat.latestMessage?.content || 'Tap to start chatting'}</div>
                        </div>
                      </div>
                    );
                  })
                ) : null}
                
                <div className="friends-section" style={{ padding: '16px' }}>
                  <p className="section-title">Friends</p>
                  {friends.length > 0 ? (
                    friends.map(f => {
                      if (chats.some(c => c.users.some(u => u._id === f._id))) return null;
                      return (
                        <div key={f._id} className="chat-item" onClick={() => startChatWithFriend(f._id)}>
                          <Avatar name={f.name} size="sm" isOnline={onlineUsers.includes(f._id)} />
                          <div className="chat-item-info">
                            <div className="chat-item-name">{f.name}</div>
                            <div className="chat-item-preview text-accent">Start chat</div>
                          </div>
                        </div>
                      );
                    })
                  ) : <p className="text-muted small">Add friends to start chatting!</p>}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── PEOPLE/REQUESTS PANEL ─── */}
        {activePanel === 'people' && (
          <div className="p-2">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(req => (
                <div key={req._id} className="chat-item">
                  <Avatar name={req.sender.username} size="sm" />
                  <div className="chat-item-info">
                    <div className="chat-item-name">@{req.sender.username}</div>
                    <div className="chat-item-preview">Wants to be friends</div>
                  </div>
                  <div className="flex gap-1">
                    <button className="icon-btn success sm" onClick={() => acceptRequest(req._id)}><Check size={14} /></button>
                    <button className="icon-btn danger sm" onClick={() => rejectRequest(req._id)}><X size={14} /></button>
                  </div>
                </div>
              ))
            ) : <div className="text-center p-8 text-muted"><Search size={32} className="mx-auto mb-2 opacity-20" /><p>No new requests</p></div>}
          </div>
        )}

        {/* ─── NOTES PANEL ─── */}
        {activePanel === 'notes' && (
          <div className="p-3">
            {showNoteForm && (
              <form onSubmit={onSubmitNote} className="mb-4 p-3 bg-surface rounded-lg border border-border">
                <input 
                  className="bg-transparent border-none w-full font-bold mb-2 outline-none" 
                  placeholder="Note Title" 
                  value={noteForm.title}
                  onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                />
                <textarea 
                  className="bg-transparent border-none w-full text-sm outline-none resize-none" 
                  placeholder="Write something..."
                  rows="3"
                  value={noteForm.content}
                  onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1">
                    {['#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff'].map(c => (
                      <div 
                        key={c} 
                        className={`w-4 h-4 rounded-full cursor-pointer border ${noteForm.color === c ? 'border-accent' : 'border-transparent'}`}
                        style={{ background: c }}
                        onClick={() => setNoteForm({...noteForm, color: c})}
                      />
                    ))}
                  </div>
                  <Button size="xs" type="submit">Save</Button>
                </div>
              </form>
            )}

            <div className="grid gap-3">
              {notes.map(note => (
                <div key={note._id} className="p-3 rounded-xl border border-border relative group" style={{ background: note.color, color: '#333' }}>
                  <button 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteNote(note._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                  <h4 className="font-bold text-sm mb-1">{note.title}</h4>
                  <p className="text-xs opacity-80">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && !showNoteForm && <p className="text-muted text-center p-8">No notes yet</p>}
            </div>
          </div>
        )}

        {/* ─── CALENDAR & REMINDERS PANEL ─── */}
        {activePanel === 'calendar' && (
          <div className="p-3">
            {/* Minimalist Calendar UI */}
            <div className="bg-surface p-3 rounded-2xl border border-border mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm">{currentMonth} {currentYear}</span>
                <div className="flex gap-2">
                  <ChevronLeft size={16} className="text-muted cursor-pointer" />
                  <ChevronRight size={16} className="text-muted cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {days.map(d => <span key={d} className="text-[10px] font-bold text-muted">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: 31 }, (_, i) => (
                  <div 
                    key={i} 
                    className={`text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${i+1 === today.getDate() ? 'bg-accent text-white' : 'hover:bg-tertiary'}`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Reminders</h3>
            </div>

            {showReminderForm && (
              <form onSubmit={onSubmitReminder} className="mb-4 p-3 bg-surface rounded-xl border border-border">
                <input 
                  className="bg-transparent border-none w-full font-bold mb-2 outline-none text-sm" 
                  placeholder="What to do?" 
                  value={reminderForm.title}
                  onChange={e => setReminderForm({...reminderForm, title: e.target.value})}
                />
                <input 
                  type="date" 
                  className="bg-transparent border-none w-full text-xs outline-none mb-2"
                  value={reminderForm.dueDate}
                  onChange={e => setReminderForm({...reminderForm, dueDate: e.target.value})}
                />
                <div className="flex justify-end">
                  <Button size="xs" type="submit">Add Task</Button>
                </div>
              </form>
            )}

            <div className="grid gap-2">
              {reminders.map(rem => (
                <div key={rem._id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border group">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${rem.isCompleted ? 'bg-success border-success' : 'border-border'}`}
                    onClick={() => handleToggleReminder(rem._id)}
                  >
                    {rem.isCompleted && <Check size={12} color="#fff" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${rem.isCompleted ? 'line-through opacity-50' : ''}`}>{rem.title}</div>
                    <div className="text-[10px] text-muted flex items-center gap-1">
                      <Clock size={10} /> {new Date(rem.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-danger"
                    onClick={() => handleDeleteReminder(rem._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {reminders.length === 0 && !showReminderForm && <p className="text-muted text-center p-4">All clear!</p>}
            </div>
          </div>
        )}

        {/* ─── PROFILE PANEL ─── */}
        {activePanel === 'profile' && (
          <div className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar name={currentUser?.name} src={currentUser?.avatar} size="lg" className="mx-auto" />
              <div className="absolute bottom-0 right-0 p-1.5 bg-accent rounded-full border-4 border-bg-secondary text-white cursor-pointer">
                <Plus size={14} />
              </div>
            </div>
            <h3 className="text-lg font-bold">{currentUser?.name} {currentUser?.lastName}</h3>
            <p className="text-secondary mb-6">@{currentUser?.username}</p>
            
            <div className="grid gap-2 text-left">
              <div className="p-3 bg-surface rounded-xl border border-border flex justify-between items-center cursor-pointer">
                <span className="text-sm">Account Privacy</span>
                <ChevronRight size={16} className="text-muted" />
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border flex justify-between items-center cursor-pointer">
                <span className="text-sm">Media & Files</span>
                <ChevronRight size={16} className="text-muted" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatSidebar;
