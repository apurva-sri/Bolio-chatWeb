import React, { useState } from 'react';
import { MessageSquare, Users, Calendar, User, Settings, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const IconSidebar = ({ activePanel, setActivePanel, hasNotifications }) => {
  const { logout } = useAuth();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Messages' },
    { id: 'people', icon: Users, label: 'People', badge: hasNotifications },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'notes', icon: FileText, label: 'Notes' },
  ];

  return (
    <aside className="icon-sidebar">
      <div className="logo">B</div>
      
      <div className="icon-list">
        {navItems.map((item) => (
          <button 
            key={item.id}
            className={`icon-btn ${activePanel === item.id ? 'active' : ''}`} 
            onClick={() => setActivePanel(item.id)}
            title={item.label}
          >
            <item.icon size={22} />
            {item.badge && <span className="badge"></span>}
          </button>
        ))}
      </div>

      <div className="spacer"></div>

      <div className="icon-list bottom">
        <button 
          className={`icon-btn ${activePanel === 'profile' ? 'active' : ''}`} 
          onClick={() => setActivePanel('profile')}
          title="My Profile"
        >
          <User size={22} />
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            className={`icon-btn ${activePanel === 'settings' ? 'active' : ''}`} 
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            title="Settings"
          >
            <Settings size={22} />
          </button>
          
          {showSettingsDropdown && (
            <div className="glass-panel" style={{
              position: 'absolute', bottom: '100%', left: '100%', 
              marginLeft: '12px', width: '180px', padding: '8px', zIndex: 100
            }}>
              <button className="chat-item" style={{ width: '100%', border: 'none', background: 'transparent' }} onClick={() => { setActivePanel('settings'); setShowSettingsDropdown(false); }}>Preferences</button>
              <button className="chat-item" style={{ width: '100%', border: 'none', background: 'transparent' }} onClick={() => { setActivePanel('settings'); setShowSettingsDropdown(false); }}>Privacy</button>
              <div className="divider"></div>
              <button className="chat-item" style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--danger)' }} onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default IconSidebar;
