import React from 'react';

const Avatar = ({ 
  src, 
  name, 
  size = 'md', 
  isOnline = false, 
  className = '' 
}) => {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl"
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`
        ${sizes[size]} rounded-full flex items-center justify-center font-bold text-white overflow-hidden
        bg-gradient-to-br from-accent to-purple-600 border border-white/10
      `}>
        {src ? (
          <img src={src} alt={name} className="w-full h-100 object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {isOnline && (
        <span className={`
          absolute bottom-0.5 right-0.5 rounded-full bg-online border-2 border-bg-secondary
          ${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'}
        `} />
      )}
    </div>
  );
};

export default Avatar;
