import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { orderService } from '../services/orderService';
import type { Order, OrderStatus } from '../types';
import { toast } from '../components/Toast';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDateTime = (d: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(d));

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Preparo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  pending: 'border-l-[var(--status-pending)]',
  in_progress: 'border-l-[var(--status-in-progress)]',
  completed: 'border-l-[var(--status-completed)]',
  cancelled: 'border-l-[var(--status-cancelled)]',
};

const STATUS_FLOW: Record<string, OrderStatus | null> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: null,
  cancelled: null,
};

const STATUS_BTN_LABELS: Record<string, string> = {
  pending: 'Iniciar Preparo',
  in_progress: 'Marcar como Concluído',
};

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const data = await orderService.get(Number(id));
      setOrder(data);
    } catch {
      toast.error('Pedido não encontrado');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      await orderService.update(order.id, { status: newStatus });
      toast.success(`Status atualizado para "${STATUS_LABELS[newStatus]}"`);
      load();
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm('Cancelar este pedido?')) return;
    await handleStatusChange('cancelled');
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" />Carregando...</div>;
  if (!order) return null;

  const nextStatus = STATUS_FLOW[order.status];

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/orders')}>
            <ArrowLeft size={14} /> Voltar aos Pedidos
          </button>
          <h2>Pedido #{order.id}</h2>
          <p>{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={updating}>
              <X size={14} /> Cancelar Pedido
            </button>
          )}
          {nextStatus && (
            <button
              className="btn btn-primary"
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updating}
            >
              {updating ? 'Atualizando...' : STATUS_BTN_LABELS[order.status]}
            </button>
          )}
        </div>
      </div>

      <div className="order-detail-grid">

        <div className="flex flex-col gap-4">
          <div className="card !p-0">
            <div className="py-4 border-b border-[var(--border-muted)]">
              <div className="card-title px-4">Itens do Pedido</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qtd</th>
                    <th>Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium">{item.menu_item?.name ?? '—'}</div>
                        {item.notes && (
                          <div className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                            📝 {item.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="bg-[var(--bg-elevated)] rounded py-0.5 px-2 font-bold text-xs text-[var(--amber-400)]">
                          {item.quantity}x
                        </span>
                      </td>
                      <td>{formatCurrency(Number(item.unit_price))}</td>
                      <td className="font-bold">{formatCurrency(Number(item.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="py-3.5 px-4 border-t border-[var(--border-muted)] flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-semibold">Total do Pedido</span>
              <span className="text-xl font-extrabold text-[var(--amber-400)]">
                {formatCurrency(Number(order.total_amount))}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="card bg-[rgba(245,158,11,0.06)] !border-[rgba(245,158,11,0.2)]">
              <div className="text-xs font-semibold text-[var(--amber-500)] mb-1.5">
                OBSERVAÇÕES
              </div>
              <div className="text-[13.5px] text-[var(--text-primary)]">{order.notes}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-title mb-4">Status do Pedido</div>
            <div className="flex flex-col gap-2">
              {(['pending', 'in_progress', 'completed', 'cancelled'] as OrderStatus[]).map(s => {
                const isActive = order.status === s;
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-2.5 py-2 px-3 rounded-md border-l-[3px] ${isActive ? `bg-[var(--bg-elevated)] ${STATUS_BORDER_COLORS[s]}` : 'bg-transparent border-l-transparent'}`}
                  >
                    <span className={`text-[13px] ${isActive ? 'font-bold text-[var(--text-primary)]' : 'font-normal text-[var(--text-muted)]'}`}>
                      {STATUS_LABELS[s]}
                    </span>
                    {isActive && <span className={`badge badge-${s} ml-auto text-[11px]`}>Atual</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-title mb-3.5">Detalhes</div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">Mesa</div>
                <div className="font-semibold">Mesa {order.table?.number ?? '—'}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">Cliente</div>
                <div className="font-semibold">{order.customer?.name ?? '—'}</div>
                {order.customer?.cpf && (
                  <div className="text-xs text-[var(--text-muted)] font-mono">
                    {order.customer.cpf}
                  </div>
                )}
              </div>
              {order.waiter && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">Garçom</div>
                  <div className="font-semibold">{order.waiter.name}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">Criado em</div>
                <div className="text-[13px]">{formatDateTime(order.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
