import React from 'react';
import { X, User, Calendar, Trash2, Shield, MapPin } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const ProfilePanel = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <aside className={`profile-panel ${isOpen ? '' : 'hidden'}`}>
      <div className="profile-panel-header">
        <span>User Details</span>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>
      
      <div className="profile-cover"></div>
      <div className="profile-body">
        <div className="profile-avatar-wrap">
          <Avatar name={user.name} src={user.avatar} size="xl" className="border-4 border-bg-secondary shadow-xl" />
        </div>
        <h3 className="profile-name">{user.name} {user.lastName}</h3>
        <p className="profile-username">@{user.username}</p>
        
        <div className="profile-status">
          <div className={`status-chip ${user.isOnline ? '' : 'opacity-50 grayscale'}`}>
            {user.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="profile-section">
          <h4>Information</h4>
          <div className="profile-info-row">
            <User size={16} />
            <span>{user.gender || 'Not specified'}</span>
          </div>
          <div className="profile-info-row">
            <Calendar size={16} />
            <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          {user.country && (
            <div className="profile-info-row">
              <MapPin size={16} />
              <span>{user.country}</span>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h4>Security</h4>
          <div className="divider"></div>
          <Button variant="secondary" size="sm" icon={Shield}>
            Privacy Settings
          </Button>
          <div style={{ height: '8px' }}></div>
          <Button variant="danger" size="sm" icon={Trash2}>
            Block User
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default ProfilePanel;
