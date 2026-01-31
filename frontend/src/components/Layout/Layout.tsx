import React from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">NexusStream</span>
          </div>
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Dashboard
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Orders
            </NavLink>
            <NavLink to="/submit" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Submit Order
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
};
