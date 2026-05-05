import { User as UserIcon } from 'lucide-react';

const Avatar = ({ 
  src, 
  name, 
  size = 'md', 
  isOnline = false, 
  className = '' 
}) => {
  const getInitials = (name, username) => {
    const text = name || username || '?';
    const parts = text.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const getBgColor = (text) => {
    const colors = [
      'linear-gradient(135deg, #6366f1, #a855f7)', // Indigo-Purple
      'linear-gradient(135deg, #3b82f6, #2dd4bf)', // Blue-Teal
      'linear-gradient(135deg, #f59e0b, #ef4444)', // Amber-Red
      'linear-gradient(135deg, #10b981, #3b82f6)', // Emerald-Blue
      'linear-gradient(135deg, #ec4899, #8b5cf6)', // Pink-Violet
    ];
    let hash = 0;
    const str = text || 'default';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name, name); // Using name for both as a test, but let's check what we receive

  return (
    <div className={`avatar-wrap ${className}`}>
      <div className={`avatar ${size === 'sm' ? 'sm' : ''}`} style={{ 
        background: src ? 'transparent' : getBgColor(name || 'User'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }}>
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ transform: 'translateY(-1px)' }}>{initials}</span>
        )}
      </div>
      {isOnline && (
        <span className="online-dot" />
      )}
    </div>
  );
};

export default Avatar;
