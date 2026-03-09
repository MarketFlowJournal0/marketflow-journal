import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'base',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: {
      backgroundColor: theme.colors.accent.cyan[600],
      color: theme.colors.text.primary,
      border: 'none',
      hover: theme.colors.accent.cyan[700],
    },
    secondary: {
      backgroundColor: theme.colors.secondary[800],
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.primary}`,
      hover: theme.colors.secondary[700],
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
      border: `1px solid ${theme.colors.border.secondary}`,
      hover: theme.colors.secondary[900],
    },
    danger: {
      backgroundColor: theme.colors.danger[700],
      color: theme.colors.text.primary,
      border: 'none',
      hover: theme.colors.danger[800],
    },
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    base: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const variantStyle = variants[variant];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizes[size]}
        font-semibold
        rounded-lg
        transition-all
        duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        backgroundColor: variantStyle.backgroundColor,
        color: variantStyle.color,
        border: variantStyle.border,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyle.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = variantStyle.backgroundColor;
        }
      }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;