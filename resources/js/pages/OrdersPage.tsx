import { useEffect, useState } from 'react';
import { Search, Eye, Trash2, Plus } from 'lucide-react';
import { orderService } from '../services/orderService';
import { tableService } from '../services/tableService';
import { customerService } from '../services/customerService';
import type { Order, Table, Customer, OrderFilters } from '../types';
import { toast } from '../components/Toast';
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

const OrdersPage = () => {
  const navigate = useNavigate();
  const { cache, setCache } = useCache();
  const [orders, setOrders] = useState<Order[]>(cache['orders_list'] || []);
  const [tables, setTables] = useState<Table[]>(cache['orders_tables'] || []);
  const [customers, setCustomers] = useState<Customer[]>(cache['orders_customers'] || []);
  const [loading, setLoading] = useState(!cache['orders_list']);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [search, setSearch] = useState('');

  const load = async () => {
    const hasCache = cache['orders_list'] && cache['orders_tables'] && cache['orders_customers'];
    const isFiltered = Object.keys(filters).length > 0;
    if (!hasCache || isFiltered) {
      setLoading(true);
    }
    try {
      const [o, t, c] = await Promise.all([
        orderService.list(filters),
        tableService.list(),
        customerService.list(),
      ]);
      setOrders(o);
      setTables(t);
      setCustomers(c);
      if (!isFiltered) {
        setCache('orders_list', o);
      }
      setCache('orders_tables', t);
      setCache('orders_customers', c);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const handleDelete = async (order: Order) => {
    if (order.status !== 'pending') {
      toast.error('Só é possível excluir pedidos pendentes');
      return;
    }
    if (!confirm(`Excluir pedido #${order.id}?`)) return;
    try {
      await orderService.delete(order.id);
      toast.success('Pedido excluído');
      load();
    } catch {
      toast.error('Erro ao excluir pedido');
    }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    return (
      String(o.id).includes(search) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.table?.number).includes(search)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Pedidos</h2>
          <p>{orders.length} pedidos encontrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/orders/new')}>
          <Plus size={15} /> Novo Pedido
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            placeholder="Buscar por #, cliente, mesa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filters.period ?? ''}
          onChange={e => setFilters(f => ({ ...f, period: (e.target.value as any) || undefined }))}
          className="!w-auto min-w-[130px]"
        >
          <option value="">Todo período</option>
          <option value="day">Hoje</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mês</option>
        </select>

        <select
          value={filters.table_id ?? ''}
          onChange={e => setFilters(f => ({ ...f, table_id: e.target.value ? Number(e.target.value) : undefined }))}
          className="!w-auto min-w-[120px]"
        >
          <option value="">Todas mesas</option>
          {tables.map(t => (
            <option key={t.id} value={t.id}>Mesa {t.number}</option>
          ))}
        </select>

        <select
          value={filters.customer_id ?? ''}
          onChange={e => setFilters(f => ({ ...f, customer_id: e.target.value ? Number(e.target.value) : undefined }))}
          className="!w-auto min-w-[160px]"
        >
          <option value="">Todos clientes</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {(filters.period || filters.table_id || filters.customer_id) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({})}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="card !p-0">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" />Carregando...</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mesa</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td className="text-[var(--amber-400)] font-bold">#{order.id}</td>
                    <td>Mesa {order.table?.number ?? '—'}</td>
                    <td>{order.customer?.name ?? '—'}</td>
                    <td className="text-[var(--text-muted)]">
                      {order.items?.length ?? 0} itens
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="font-bold">{formatCurrency(Number(order.total_amount))}</td>
                    <td className="text-[var(--text-muted)] text-xs">{formatDate(order.created_at)}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye size={13} />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            className="btn btn-ghost btn-sm btn-icon text-[var(--status-cancelled)]"
                            onClick={() => handleDelete(order)}
                            title="Excluir pedido"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <p>Nenhum pedido encontrado</p>
                        <span>Tente ajustar os filtros ou criar um novo pedido</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
