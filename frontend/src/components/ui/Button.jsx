import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon: Icon,
  loading = false,
  disabled = false,
  ...props 
}) => {
  const baseStyles = "btn-base flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-95";
  
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-sm success",
    danger: "btn-sm danger",
    ghost: "btn-ghost"
  };

  return (
    <button
      className={`${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="loading-spin" style={{ margin: '0 auto' }} />
      ) : (
        <>
          {Icon && <Icon size={18} style={{ marginRight: '8px' }} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
