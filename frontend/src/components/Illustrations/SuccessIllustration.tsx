import React from 'react';

interface Props {
  className?: string;
}

export const SuccessIllustration: React.FC<Props> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00ff9d" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Background circles */}
    <circle cx="80" cy="80" r="70" fill="#00ff9d" opacity="0.1" />
    <circle cx="80" cy="80" r="55" fill="#00ff9d" opacity="0.15" />
    
    {/* Main circle */}
    <circle
      cx="80"
      cy="80"
      r="40"
      fill="url(#successGrad)"
      filter="url(#glow)"
    />
    
    {/* Checkmark */}
    <path
      d="M60 80 L73 93 L100 66"
      fill="none"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Sparkles */}
    <circle cx="130" cy="40" r="4" fill="#00ff9d" opacity="0.8">
      <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
    </circle>
    <circle cx="30" cy="50" r="3" fill="#10b981" opacity="0.7">
      <animate attributeName="r" values="3;5;3" dur="1.2s" repeatCount="indefinite" />
    </circle>
    <circle cx="140" cy="110" r="3" fill="#00ff9d" opacity="0.6">
      <animate attributeName="r" values="3;4;3" dur="0.8s" repeatCount="indefinite" />
    </circle>
    <circle cx="25" cy="120" r="4" fill="#10b981" opacity="0.5">
      <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />
    </circle>
    
    {/* Stars */}
    <path
      d="M145 75 l2 4 4 2 -4 2 -2 4 -2-4 -4-2 4-2z"
      fill="#00ff9d"
      opacity="0.8"
    >
      <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
    </path>
    <path
      d="M20 85 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5-3 -3-1.5 3-1.5z"
      fill="#10b981"
      opacity="0.7"
    >
      <animate attributeName="opacity" values="0.7;1;0.7" dur="1.3s" repeatCount="indefinite" />
    </path>
  </svg>
);
