import React from 'react';

interface Props {
  className?: string;
}

export const DashboardIllustration: React.FC<Props> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 400 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background grid pattern */}
    <defs>
      <linearGradient id="dashGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ba5ec" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="dashGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#bf00ff" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    
    {/* Decorative circles */}
    <circle cx="350" cy="30" r="60" fill="url(#dashGrad1)" opacity="0.15" />
    <circle cx="30" cy="170" r="40" fill="url(#dashGrad2)" opacity="0.15" />
    
    {/* Main chart visualization */}
    <rect x="40" y="60" width="120" height="100" rx="8" fill="url(#cardGrad)" stroke="url(#dashGrad1)" strokeWidth="1" />
    
    {/* Bar chart inside */}
    <rect x="55" y="110" width="15" height="35" rx="2" fill="url(#dashGrad1)" />
    <rect x="75" y="95" width="15" height="50" rx="2" fill="url(#dashGrad1)" opacity="0.7" />
    <rect x="95" y="80" width="15" height="65" rx="2" fill="url(#dashGrad1)" opacity="0.85" />
    <rect x="115" y="105" width="15" height="40" rx="2" fill="url(#dashGrad1)" opacity="0.6" />
    <rect x="135" y="75" width="15" height="70" rx="2" fill="url(#dashGrad1)" />
    
    {/* Pie chart card */}
    <rect x="180" y="60" width="100" height="100" rx="8" fill="url(#cardGrad)" stroke="url(#dashGrad2)" strokeWidth="1" />
    <circle cx="230" cy="110" r="30" fill="none" stroke="url(#dashGrad2)" strokeWidth="8" strokeDasharray="94 188" strokeLinecap="round" />
    <circle cx="230" cy="110" r="30" fill="none" stroke="url(#dashGrad1)" strokeWidth="8" strokeDasharray="60 188" strokeDashoffset="-94" strokeLinecap="round" />
    
    {/* Line chart card */}
    <rect x="300" y="60" width="90" height="100" rx="8" fill="url(#cardGrad)" stroke="url(#dashGrad1)" strokeWidth="1" />
    <path
      d="M315 130 L330 115 L345 125 L360 95 L375 105"
      fill="none"
      stroke="url(#dashGrad1)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="315" cy="130" r="3" fill="#0ba5ec" />
    <circle cx="330" cy="115" r="3" fill="#0ba5ec" />
    <circle cx="345" cy="125" r="3" fill="#0ba5ec" />
    <circle cx="360" cy="95" r="3" fill="#7c3aed" />
    <circle cx="375" cy="105" r="3" fill="#7c3aed" />
    
    {/* Floating data points */}
    <circle cx="100" cy="40" r="4" fill="#00f0ff" opacity="0.8">
      <animate attributeName="cy" values="40;35;40" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="250" cy="35" r="3" fill="#bf00ff" opacity="0.8">
      <animate attributeName="cy" values="35;40;35" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="380" cy="45" r="5" fill="#00ff9d" opacity="0.8">
      <animate attributeName="cy" values="45;38;45" dur="1.8s" repeatCount="indefinite" />
    </circle>
  </svg>
);
