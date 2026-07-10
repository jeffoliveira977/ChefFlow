import { useEffect, useState, useCallback } from 'react';
import { ChefHat, RefreshCw } from 'lucide-react';
import { orderService } from '../services/orderService';
import type { Order } from '../types';
import { toast } from '../components/Toast';

import { useCache } from '../contexts/CacheContext';

const formatTime = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff === 1) return '1 min atrás';
  return `${diff} min atrás`;
};

const KitchenPage = () => {
  const { cache, setCache } = useCache();
  const [orders, setOrders] = useState<Order[]>(cache['kitchen_orders'] || []);
  const [loading, setLoading] = useState(!cache['kitchen_orders']);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await orderService.getCookOrders();
      setOrders(data);
      setCache('kitchen_orders', data);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const startPreparing = async (order: Order) => {
    setUpdating(order.id);

    try {
      await orderService.update(order.id, { status: 'in_progress' });
      toast.success(`Pedido #${order.id} marcado como em preparo`);
      await load();
    } catch {
      toast.error('Erro ao atualizar pedido');
    } finally {
      setUpdating(null);
    }
  };

  const markReady = async (order: Order) => {
    setUpdating(order.id);

    try {
      await orderService.update(order.id, { status: 'completed' });
      toast.success(`Pedido #${order.id} marcado como concluído`);
      await load();
    } catch {
      toast.error('Erro ao atualizar pedido');
    } finally {
      setUpdating(null);
    }
  };

  const pending = orders.filter(o => o.status === 'pending');
  const inProgress = orders.filter(o => o.status === 'in_progress');

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        Carregando pedidos...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Painel da Cozinha</h2>
          <p>Pedidos para preparar e em andamento</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={15} />
          Atualizar
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="card !p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Em Preparo</h3>
            <span className="bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full text-[11.5px] font-bold text-[var(--text-secondary)]">
              {inProgress.length}
            </span>
          </div>
          <div className="kitchen-grid">
            {inProgress.length === 0 && (
              <div className="col-span-full py-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-2">
                <ChefHat size={32} />
                <p>Nenhum pedido em preparo</p>
              </div>
            )}
            {inProgress.map(order => (
              <div key={order.id} className="card kitchen-card bg-[var(--bg-surface)] hover:border-[var(--border)] transition-colors">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--amber-400)]">#{order.id}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{formatTime(order.created_at)}</span>
                  </div>
                  <div className="text-[12.5px] text-[var(--text-secondary)]">
                    Mesa {order.table?.number} · {order.customer?.name}
                  </div>
                  {order.notes && (
                    <div className="bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] rounded-md py-1.5 px-2.5 text-xs text-[#60a5fa]">
                      📝 {order.notes}
                    </div>
                  )}
                  <div className="flex flex-col gap-[3px] my-1">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-primary)]">
                        <span className="rounded text-[11px] font-bold text-[var(--amber-400)] shrink-0 px-1.5 py-px bg-[var(--bg-elevated)]">{item.quantity}x</span>
                        <span>{item.menu_item?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-tertiary btn-sm justify-center kitchen-card-footer"
                  disabled={updating === order.id}
                  onClick={() => markReady(order)}
                >
                  {updating === order.id ? 'Atualizando...' : 'Marcar como Pronto'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Section */}
        <div className="card !p-5">
          <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-[var(--border-muted)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--amber-500)]" />
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">A Fazer</h3>
            <span className="bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full text-[11.5px] font-bold text-[var(--text-secondary)]">
              {pending.length}
            </span>
          </div>
          <div className="kitchen-grid">
            {pending.length === 0 && (
              <div className="col-span-full py-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-2">
                <ChefHat size={32} />
                <p>Sem pedidos pendentes</p>
              </div>
            )}
            {pending.map(order => (
              <div key={order.id} className="card kitchen-card bg-[var(--bg-surface)] hover:border-[var(--border)] transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--amber-400)]">#{order.id}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">{formatTime(order.created_at)}</span>
                </div>
                <div className="text-[12.5px] text-[var(--text-secondary)]">
                  Mesa {order.table?.number} · {order.customer?.name}
                </div>
                {order.notes && (
                  <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-md py-1.5 px-2.5 text-xs text-[var(--amber-400)]">
                    📝 {order.notes}
                  </div>
                )}
                <div className="flex flex-col gap-[3px] my-1">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-primary)]">
                      <span className="rounded text-[11px] font-bold text-[var(--amber-400)] shrink-0 px-1.5 py-px bg-[var(--bg-elevated)]">{item.quantity}x</span>
                      <span>{item.menu_item?.name}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-sm w-full justify-center kitchen-card-footer"
                  disabled={updating === order.id}
                  onClick={() => startPreparing(order)}
                >
                  {updating === order.id ? 'Atualizando...' : 'Iniciar Preparo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenPage;