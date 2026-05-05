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
      <div className="relative group">
        {Icon && (
          <Icon 
            size={18} 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors duration-200" 
          />
        )}
        <input
          className={`
            w-full bg-bg-tertiary border border-border rounded-xl py-2.5 outline-none transition-all duration-200
            ${Icon ? 'pl-11 pr-4' : 'px-4'}
            focus:border-accent focus:ring-4 focus:ring-accent-soft
            placeholder:text-text-muted text-sm
            ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger ml-1 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
