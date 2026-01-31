import React from 'react';
import './Loading.css';

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
  const content = (
    <div className={`loading loading-${size}`}>
      <div className="loading-spinner" />
      {text && <span className="loading-text">{text}</span>}
    </div>
  );

  if (fullPage) {
    return <div className="loading-fullpage">{content}</div>;
  }

  return content;
};
