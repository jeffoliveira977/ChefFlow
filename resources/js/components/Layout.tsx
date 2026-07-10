import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';

const Layout = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div 
          className="sidebar-overlay-active" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-content">
        <header className="mobile-header">
          <button 
            className="menu-toggle-btn" 
            onClick={() => setSidebarOpen(true)}
            title="Abrir menu"
          >
            <Menu size={24} />
          </button>
          <span className="mobile-logo-text">ChefFlow</span>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
