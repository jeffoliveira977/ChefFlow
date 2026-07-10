import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed,
  Users, Table2, BookOpen, ChefHat, LogOut, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout, isWaiter, isCook } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveRoute = (path: string, exact = false) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('') ?? '?';

  const roleLabel = user?.role === 'waiter' ? 'Garçom' : user?.role === 'cook' ? 'Cozinheiro' : '';

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <UtensilsCrossed size={18} />
        </div>
        <div className="flex-1">
          <div className="sidebar-logo-text">RestaurantApp</div>
          <div className="sidebar-logo-sub">Sistema de Gestão</div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} title="Fechar menu">
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Visão Geral</div>

        <NavLink to="/dashboard" onClick={onClose} className={`nav-item${isActiveRoute('/dashboard') ? ' active' : ''}`}>
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        {isCook && (
          <>
            <div className="sidebar-section-label">Cozinha</div>
            <NavLink to="/kitchen" onClick={onClose} className={`nav-item${isActiveRoute('/kitchen') ? ' active' : ''}`}>
              <ChefHat size={16} />
              Painel da Cozinha
            </NavLink>
          </>
        )}

        {isWaiter && (
          <>
            <div className="sidebar-section-label">Operações</div>
            <NavLink to="/orders" end onClick={onClose} className={`nav-item${isActiveRoute('/orders', true) ? ' active' : ''}`}>
              <ShoppingBag size={16} />
              Pedidos
            </NavLink>
            <NavLink to="/orders/new" onClick={onClose} className={`nav-item${isActiveRoute('/orders/new') ? ' active' : ''}`}>
              <ShoppingBag size={16} />
              Novo Pedido
            </NavLink>
            <NavLink to="/tables" onClick={onClose} className={`nav-item${isActiveRoute('/tables') ? ' active' : ''}`}>
              <Table2 size={16} />
              Mesas
            </NavLink>
            <NavLink to="/customers" onClick={onClose} className={`nav-item${isActiveRoute('/customers') ? ' active' : ''}`}>
              <Users size={16} />
              Clientes
            </NavLink>

            <div className="sidebar-section-label">Cardápio</div>
            <NavLink to="/menu" onClick={onClose} className={`nav-item${isActiveRoute('/menu') ? ' active' : ''}`}>
              <BookOpen size={16} />
              Cardápio
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
