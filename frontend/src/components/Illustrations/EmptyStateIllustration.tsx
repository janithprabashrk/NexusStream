import React from 'react';

interface Props {
  className?: string;
}

export const EmptyStateIllustration: React.FC<Props> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="emptyGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ba5ec" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="emptyGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d1d5db" />
        <stop offset="100%" stopColor="#9ca3af" />
      </linearGradient>
    </defs>
    
    {/* Document stack */}
    <rect x="55" y="30" width="90" height="110" rx="8" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    <rect x="60" y="25" width="90" height="110" rx="8" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
    <rect x="65" y="20" width="90" height="110" rx="8" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
    
    {/* Document lines */}
    <rect x="80" y="40" width="45" height="4" rx="2" fill="url(#emptyGrad2)" opacity="0.4" />
    <rect x="80" y="52" width="60" height="4" rx="2" fill="url(#emptyGrad2)" opacity="0.3" />
    <rect x="80" y="64" width="50" height="4" rx="2" fill="url(#emptyGrad2)" opacity="0.3" />
    <rect x="80" y="76" width="55" height="4" rx="2" fill="url(#emptyGrad2)" opacity="0.3" />
    
    {/* Magnifying glass */}
    <circle cx="140" cy="95" r="22" fill="none" stroke="url(#emptyGrad1)" strokeWidth="4" />
    <line x1="155" y1="111" x2="172" y2="128" stroke="url(#emptyGrad1)" strokeWidth="4" strokeLinecap="round" />
    
    {/* Question mark inside */}
    <text x="140" y="102" fontSize="18" fontWeight="bold" fill="url(#emptyGrad1)" textAnchor="middle">?</text>
    
    {/* Floating dots */}
    <circle cx="40" cy="50" r="4" fill="#0ba5ec" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="170" cy="30" r="3" fill="#7c3aed" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="25" cy="120" r="5" fill="#00ff9d" opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.8s" repeatCount="indefinite" />
    </circle>
  </svg>
);
