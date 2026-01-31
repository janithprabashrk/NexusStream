import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'cyber';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
}) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300',
    primary: 'bg-cyber-500/10 dark:bg-cyber-500/20 text-cyber-600 dark:text-cyber-400',
    success: 'bg-green-500/10 dark:bg-neon-green/20 text-green-600 dark:text-neon-green',
    warning: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    cyber: 'bg-gradient-to-r from-cyber-500/10 to-neon-purple/10 dark:from-neon-cyan/20 dark:to-neon-purple/20 text-cyber-600 dark:text-neon-cyan border border-cyber-500/20 dark:border-neon-cyan/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'success' ? 'bg-green-500 dark:bg-neon-green' : 
            variant === 'danger' ? 'bg-red-500' : 'bg-cyber-500 dark:bg-neon-cyan'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            variant === 'success' ? 'bg-green-500 dark:bg-neon-green' : 
            variant === 'danger' ? 'bg-red-500' : 'bg-cyber-500 dark:bg-neon-cyan'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};
