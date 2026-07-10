import { useEffect, useState } from 'react';
import {
  ShoppingBag, Users, Table2, TrendingUp,
  Clock, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { tableService } from '../services/tableService';
import { customerService } from '../services/customerService';
import type { Order, Table, Customer } from '../types';
import { useNavigate } from 'react-router-dom';

import { useCache } from '../contexts/CacheContext';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Preparo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const DashboardPage = () => {
  const { user, isWaiter } = useAuth();
  const navigate = useNavigate();
  const { cache, setCache } = useCache();
  const [orders, setOrders] = useState<Order[]>(cache['dashboard_orders'] || []);
  const [tables, setTables] = useState<Table[]>(cache['dashboard_tables'] || []);
  const [customers, setCustomers] = useState<Customer[]>(cache['dashboard_customers'] || []);
  const [loading, setLoading] = useState(!cache['dashboard_orders']);

  useEffect(() => {
    const load = async () => {
      try {
        const [o, t, c] = await Promise.all([
          orderService.list({ period: 'day' }),
          tableService.list(),
          customerService.list(),
        ]);
        setOrders(o);
        setTables(t);
        setCustomers(c);
        setCache('dashboard_orders', o);
        setCache('dashboard_tables', t);
        setCache('dashboard_customers', c);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pending = orders.filter(o => o.status === 'pending').length;
  const inProgress = orders.filter(o => o.status === 'in_progress').length;
  const completed = orders.filter(o => o.status === 'completed').length;
  const revenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  const recentOrders = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 8);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Carregando...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Bem-vindo, {user?.name}!</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pedidos Hoje</span>
            <div className="stat-icon bg-[rgba(245,158,11,0.15)]">
              <ShoppingBag size={18} color="var(--amber-400)" />
            </div>
          </div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-desc">Total de pedidos no dia</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pendentes</span>
            <div className="stat-icon bg-[rgba(245,158,11,0.15)]">
              <Clock size={18} color="var(--amber-400)" />
            </div>
          </div>
          <div className="stat-value">{pending}</div>
          <div className="stat-desc">{inProgress} em preparo</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Concluídos</span>
            <div className="stat-icon bg-[rgba(34,197,94,0.12)]">
              <CheckCircle size={18} color="#4ade80" />
            </div>
          </div>
          <div className="stat-value">{completed}</div>
          <div className="stat-desc">Pedidos finalizados hoje</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Faturamento</span>
            <div className="stat-icon bg-[rgba(245,158,11,0.15)]">
              <TrendingUp size={18} color="var(--amber-400)" />
            </div>
          </div>
          <div className="stat-value !text-xl">{formatCurrency(revenue)}</div>
          <div className="stat-desc">Em pedidos concluídos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Mesas Livres</span>
            <div className="stat-icon bg-[rgba(34,197,94,0.12)]">
              <Table2 size={18} color="#4ade80" />
            </div>
          </div>
          <div className="stat-value">{availableTables}</div>
          <div className="stat-desc">{occupiedTables} ocupadas</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Clientes</span>
            <div className="stat-icon bg-[rgba(59,130,246,0.12)]">
              <Users size={18} color="#60a5fa" />
            </div>
          </div>
          <div className="stat-value">{customers.length}</div>
          <div className="stat-desc">Clientes cadastrados</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Pedidos Recentes</div>
            <div className="card-subtitle">Últimos pedidos do dia</div>
          </div>
          {isWaiter && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')}>
              Ver todos
            </button>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={40} />
            <p>Nenhum pedido hoje</p>
            <span>Os pedidos de hoje aparecerão aqui</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mesa</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Horário</th>
                  {isWaiter && <th></th>}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="text-[var(--amber-400)] font-bold">#{order.id}</td>
                    <td>Mesa {order.table?.number ?? '—'}</td>
                    <td>{order.customer?.name ?? '—'}</td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="font-bold">{formatCurrency(Number(order.total_amount))}</td>
                    <td className="text-[var(--text-muted)]">{formatDate(order.created_at)}</td>
                    {isWaiter && (
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          Ver
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
