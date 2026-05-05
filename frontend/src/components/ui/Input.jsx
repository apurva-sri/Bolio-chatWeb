import React from 'react';

const Input = ({ 
  label, 
  icon: Icon, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="search-input-wrap">
        {Icon && (
          <Icon 
            size={18} 
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
        )}
        <input
          className={`input-field ${className}`}
          style={Icon ? { paddingLeft: '36px' } : {}}
          {...props}
        />
      </div>
      {error && <p className="error-text" style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
};

export default Input;
