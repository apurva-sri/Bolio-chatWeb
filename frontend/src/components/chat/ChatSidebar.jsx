import React, { useState } from 'react';
import { Search, Plus, ChevronLeft, Check, X, Calendar as CalIcon, StickyNote, Clock, Trash2, ChevronRight, Users } from 'lucide-react';
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
    <section className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ─── HEADER ─── */}
      <div className="sidebar-header" style={{ 
        padding: '24px 20px', 
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex items-center justify-between">
          <h2 style={{ 
            fontSize: '22px', 
            fontWeight: '900', 
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)'
          }}>
            {activePanel === 'calendar' ? 'Calendar' : 
             activePanel === 'notes' ? 'My Notes' : 
             globalSearch ? 'Discovery' : 'Messages'}
          </h2>
          
          {(activePanel === 'notes' || activePanel === 'calendar') && (
            <button 
              className="add-btn"
              onClick={() => activePanel === 'notes' ? setShowNoteForm(!showNoteForm) : setShowReminderForm(!showReminderForm)}
              style={{ 
                width: '36px', height: '36px', borderRadius: '12px',
                background: 'var(--accent)', color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                marginLeft: 'auto'
              }}
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* ─── SEARCH PANEL ─── */}
        {activePanel === 'chats' && (
          <div className="px-2 mb-4">
            <Button 
              variant={globalSearch ? 'secondary' : 'primary'}
              size="sm"
              fullWidth
              className="mb-3"
              icon={globalSearch ? ChevronLeft : Plus}
              onClick={() => setGlobalSearch(!globalSearch)}
            >
              {globalSearch ? 'Back to Messages' : 'Discover People'}
            </Button>
            
            <div className="search-input-wrap" style={{ 
              background: 'var(--bg-tertiary)', 
              borderRadius: '12px', 
              padding: '2px 12px',
              border: '1px solid var(--border)'
            }}>
              <Search size={16} className="text-muted" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={handleSearch}
                style={{ background: 'transparent', border: 'none', padding: '10px', fontSize: '14px', width: '100%', outline: 'none', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        )}

        {/* ─── MESSAGES PANEL ─── */}
        {activePanel === 'chats' && !globalSearch && (
          <div className="chat-list-items">
            {chats.length > 0 ? chats.map(chat => {
              const otherUser = chat.users.find(u => u._id !== currentUser?._id);
              const isOnline = onlineUsers.includes(otherUser?._id);
              return (
                <div 
                  key={chat._id} 
                  className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                  onClick={() => selectChat(chat)}
                  style={{ 
                    padding: '12px', borderRadius: '16px', marginBottom: '4px',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: selectedChat?._id === chat._id ? 'var(--accent-soft)' : 'transparent',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <Avatar name={otherUser?.name} src={otherUser?.avatar} isOnline={isOnline} />
                  <div className="chat-item-info" style={{ marginLeft: '12px', flex: 1 }}>
                    <div className="chat-item-name" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{otherUser?.name}</div>
                    <div className="chat-item-preview" style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.7 }}>{chat.latestMessage?.content || 'New conversation'}</div>
                  </div>
                </div>
              );
            }) : <div className="text-center py-12 opacity-30 text-sm">No chats yet</div>}
            
            <div className="friends-section" style={{ padding: '16px 8px' }}>
              <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Friends</p>
              {friends.length > 0 ? friends.map(f => {
                if (chats.some(c => c.users.some(u => u._id === f._id))) return null;
                return (
                  <div key={f._id} className="chat-item" onClick={() => startChatWithFriend(f._id)} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}>
                    <Avatar name={f.name} size="sm" isOnline={onlineUsers.includes(f._id)} />
                    <div style={{ marginLeft: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--accent)' }}>Start Chat</div>
                    </div>
                  </div>
                );
              }) : null}
            </div>
          </div>
        )}

        {/* ─── GLOBAL SEARCH PANEL ─── */}
        {activePanel === 'chats' && globalSearch && (
          <div className="search-results px-2">
            {searchResults.length > 0 ? searchResults.map(u => (
              <div key={u._id} className="chat-item" style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '16px' }}>
                <Avatar name={u.username} size="sm" />
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div style={{ fontWeight: '700' }}>@{u.username}</div>
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>{u.name}</div>
                </div>
                <Button size="sm" variant="success" onClick={() => sendRequest(u._id)}>Add</Button>
              </div>
            )) : <p className="text-center py-8 text-muted">Search for people...</p>}
          </div>
        )}

        {/* ─── PEOPLE PANEL ─── */}
        {activePanel === 'people' && (
          <div className="p-2">
            {pendingRequests.length > 0 ? pendingRequests.map(req => (
              <div key={req._id} className="chat-item" style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '16px', background: 'var(--bg-tertiary)', marginBottom: '8px' }}>
                <Avatar name={req.sender.username} size="sm" />
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div style={{ fontWeight: '700' }}>@{req.sender.username}</div>
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>Friend Request</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => acceptRequest(req._id)} style={{ padding: '6px', borderRadius: '8px', background: 'var(--online)', color: '#fff', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                  <button onClick={() => rejectRequest(req._id)} style={{ padding: '6px', borderRadius: '8px', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                </div>
              </div>
            )) : <div className="text-center py-20 opacity-20"><Users size={48} className="mx-auto" /><p>No requests</p></div>}
          </div>
        )}

        {/* ─── NOTES PANEL ─── */}
        {activePanel === 'notes' && (
          <div className="notes-container px-2">
            {showNoteForm && (
              <div className="form-card" style={{ 
                background: 'var(--bg-secondary)', padding: '20px', borderRadius: '24px',
                border: '1px solid var(--border)', marginBottom: '20px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
              }}>
                <input 
                  className="note-title-input" 
                  placeholder="Note Title" 
                  autoFocus
                  style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)', outline: 'none' }}
                  value={noteForm.title}
                  onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                />
                <textarea 
                  className="note-content-input" 
                  placeholder="Start writing..."
                  rows="4"
                  style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '14px', lineHeight: '1.6', outline: 'none', color: 'var(--text-secondary)', resize: 'none' }}
                  value={noteForm.content}
                  onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                />
                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex gap-2">
                    {['#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff'].map(c => (
                      <div 
                        key={c} 
                        style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: noteForm.color === c ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}
                        onClick={() => setNoteForm({...noteForm, color: c})}
                      />
                    ))}
                  </div>
                  <Button size="sm" onClick={onSubmitNote}>Save Note</Button>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gap: '12px' }}>
              {notes.map(note => (
                <div key={note._id} style={{ background: note.color, padding: '16px', borderRadius: '20px', color: '#1a1a1a', position: 'relative' }}>
                  <h4 style={{ fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>{note.title}</h4>
                  <p style={{ fontSize: '12px', opacity: 0.8, lineHeight: '1.4' }}>{note.content}</p>
                  <button onClick={() => handleDeleteNote(note._id)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {notes.length === 0 && !showNoteForm && <div className="text-center py-20 opacity-20"><StickyNote size={48} className="mx-auto" /></div>}
            </div>
          </div>
        )}

        {/* ─── CALENDAR PANEL ─── */}
        {activePanel === 'calendar' && (
          <div className="calendar-panel px-2">
            <div className="calendar-card" style={{ background: 'var(--bg-secondary)', borderRadius: '28px', padding: '24px', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <div className="flex items-center justify-between mb-6">
                <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px', color: 'var(--text-secondary)' }}>{currentMonth} {currentYear}</span>
                <div className="flex gap-2">
                  <ChevronLeft size={18} className="cursor-pointer opacity-50" />
                  <ChevronRight size={18} className="cursor-pointer opacity-50" />
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center">
                {days.map((d, i) => <span key={i} style={{ fontSize: '10px', fontWeight: '900', opacity: 0.3, marginBottom: '8px' }}>{d}</span>)}
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate();
                  const isSelected = reminderForm.dueDate.includes(`-05-${day < 10 ? '0' + day : day}`);
                  return (
                    <div 
                      key={i}
                      onClick={() => {
                        setReminderForm({...reminderForm, dueDate: `2026-05-${day < 10 ? '0' + day : day}T12:00`});
                        setShowReminderForm(true);
                      }}
                      style={{ 
                        fontSize: '13px', fontWeight: '700', padding: '8px', borderRadius: '12px', cursor: 'pointer',
                        background: isToday ? 'var(--accent)' : isSelected ? 'var(--accent-soft)' : 'transparent',
                        color: isToday ? '#fff' : 'var(--text-primary)',
                        border: isSelected ? '1px solid var(--accent)' : 'none'
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {showReminderForm && (
              <div className="reminder-form" style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '20px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <input 
                  placeholder="New task..." 
                  style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)', outline: 'none' }}
                  value={reminderForm.title}
                  onChange={e => setReminderForm({...reminderForm, title: e.target.value})}
                />
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>DUE DATE</label>
                  <input 
                    type="datetime-local" 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', width: '100%', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', outline: 'none' }}
                    value={reminderForm.dueDate}
                    onChange={e => setReminderForm({...reminderForm, dueDate: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowReminderForm(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={onSubmitReminder} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Set Reminder</button>
                </div>
              </div>
            )}

            <div className="reminders-list" style={{ display: 'grid', gap: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Reminders</p>
              {reminders.map(rem => (
                <div key={rem._id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    onClick={() => handleToggleReminder(rem._id)}
                    style={{ width: '18px', height: '18px', borderRadius: '6px', border: '2px solid var(--accent)', background: rem.isCompleted ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {rem.isCompleted && <Check size={12} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', textDecoration: rem.isCompleted ? 'line-through' : 'none', opacity: rem.isCompleted ? 0.5 : 1 }}>{rem.title}</div>
                    <div style={{ fontSize: '10px', opacity: 0.4 }}>{new Date(rem.dueDate).toLocaleString()}</div>
                  </div>
                  <button onClick={() => handleDeleteReminder(rem._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.2 }}>
                    <Trash2 size={14} className="text-danger" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── PROFILE PANEL ─── */}
        {activePanel === 'profile' && (
          <div className="p-6 text-center">
            <Avatar name={currentUser?.name} src={currentUser?.avatar} size="lg" className="mx-auto mb-4" />
            <h3 className="text-lg font-bold">{currentUser?.name}</h3>
            <p className="text-secondary mb-8">@{currentUser?.username}</p>
            <div style={{ display: 'grid', gap: '8px', textAlign: 'left' }}>
              <div className="p-4 bg-tertiary rounded-xl flex justify-between items-center cursor-pointer hover:bg-surface transition-colors">
                <span>Account Settings</span>
                <ChevronRight size={16} />
              </div>
              <div className="p-4 bg-tertiary rounded-xl flex justify-between items-center cursor-pointer hover:bg-surface transition-colors">
                <span>Privacy & Security</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatSidebar;
