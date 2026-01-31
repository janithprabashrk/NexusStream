import React from 'react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullPage = false,
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-2 border-gray-200 dark:border-dark-600`} />
        <div 
          className={`
            ${sizes[size]} rounded-full border-2 border-transparent border-t-cyber-500 dark:border-t-neon-cyan
            absolute inset-0 animate-spin
          `}
        />
        <div 
          className={`
            absolute inset-0 ${sizes[size]} rounded-full
            bg-gradient-to-r from-cyber-500/20 to-neon-purple/20 dark:from-neon-cyan/20 dark:to-neon-purple/20
            blur-xl animate-pulse
          `}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 dark:bg-dark-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
