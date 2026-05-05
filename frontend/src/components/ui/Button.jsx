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
    primary: "bg-accent text-white hover:bg-accent-hover shadow-lg shadow-accent/20",
    secondary: "bg-bg-tertiary text-text-primary hover:bg-surface-hover border border-border",
    success: "bg-online/10 text-online hover:bg-online/20",
    danger: "bg-danger/10 text-danger hover:bg-danger/20",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-2xl"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
