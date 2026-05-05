import React from 'react';
import { MessageSquare, Users, Calendar, User, Settings, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const IconSidebar = ({ activePanel, setActivePanel, hasNotifications }) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'chats', icon: MessageSquare, label: 'Messages' },
    { id: 'people', icon: Users, label: 'People', badge: hasNotifications },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'notes', icon: FileText, label: 'Notes' },
  ];

  const bottomItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="icon-sidebar">
      <div className="logo">B</div>
      
      <div className="flex flex-col gap-2 w-full items-center">
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

      <div className="flex flex-col gap-2 w-full items-center mb-2">
        {bottomItems.map((item) => (
          <button 
            key={item.id}
            className={`icon-btn ${activePanel === item.id ? 'active' : ''}`} 
            onClick={() => setActivePanel(item.id)}
            title={item.label}
          >
            <item.icon size={22} />
          </button>
        ))}
        
        <button 
          className="icon-btn hover:text-danger mt-2" 
          onClick={logout} 
          title="Logout"
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
};

export default IconSidebar;
