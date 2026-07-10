import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Eye, User, DollarSign } from 'lucide-react';
import { tableService } from '../services/tableService';
import { orderService } from '../services/orderService';
import type { Table, Order } from '../types';
import { toast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

import { useCache } from '../contexts/CacheContext';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const TablesPage = () => {
  const navigate = useNavigate();
  const { cache, setCache } = useCache();
  const [tables, setTables] = useState<Table[]>(cache['tables_list'] || []);
  const [orders, setOrders] = useState<Order[]>(cache['tables_orders_list'] || []);
  const [loading, setLoading] = useState(!cache['tables_list']);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [formNumber, setFormNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [t, o] = await Promise.all([
        tableService.list(),
        orderService.list()
      ]);
      setTables(t);
      setOrders(o);
      setCache('tables_list', t);
      setCache('tables_orders_list', o);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFormNumber('');
    setShowModal(true);
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await tableService.update(editing.id, { number: Number(formNumber) });
        toast.success('Mesa atualizada!');
      } else {
        await tableService.create({ number: Number(formNumber) });
        toast.success('Mesa criada!');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Excluir Mesa ${table.number}?`)) return;
    try {
      await tableService.delete(table.id);
      toast.success('Mesa excluída');
      load();
    } catch {
      toast.error('Erro ao excluir mesa');
    }
  };

  const getActiveOrder = (tableId: number) => {
    return orders.find(
      o => o.table_id === tableId && o.status !== 'completed' && o.status !== 'cancelled'
    );
  };

  const filtered = tables.filter(t => {
    const order = getActiveOrder(t.id);
    const searchLower = search.toLowerCase();
    return (
      String(t.number).includes(searchLower) ||
      t.status.includes(searchLower) ||
      (order?.customer?.name?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" />Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Painel de Mesas</h2>
          <p>{tables.length} mesas · {tables.filter(t => t.status === 'available').length} livres</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Nova Mesa
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tables-grid">
        {filtered.map(table => {
          const activeOrder = getActiveOrder(table.id);
          const isOccupied = table.status === 'occupied';

          return (
            <div
              key={table.id}
              className={`table-tile ${table.status}`}
            >
              <div className="table-tile-header">
                <span className="table-tile-number">Mesa {table.number}</span>
                <div className="table-tile-admin-actions">
                  <button
                    className="btn btn-ghost btn-sm btn-icon p-1 h-auto w-auto text-[var(--status-cancelled)]"
                    onClick={() => handleDelete(table)}
                    title="Excluir mesa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="table-tile-content">
                {isOccupied && activeOrder ? (
                  <>
                    <div className="table-tile-client flex items-center gap-1.5">
                      <User size={13} color="var(--text-muted)" />
                      {activeOrder.customer?.name}
                    </div>
                    <div className="table-tile-value flex items-center gap-1.5">
                      <DollarSign size={13} color="var(--amber-500)" />
                      {formatCurrency(Number(activeOrder.total_amount))}
                    </div>
                  </>
                ) : (
                  <span className="text-[var(--text-muted)] text-[12.5px]">
                    Livre e pronta para atendimento
                  </span>
                )}
              </div>

              <div className="mt-auto pt-2">
                {isOccupied && activeOrder ? (
                  <button
                    className="btn btn-secondary btn-sm w-full flex justify-center gap-1.5 bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] text-[var(--amber-400)]"
                    onClick={() => navigate(`/orders/${activeOrder.id}`)}
                  >
                    <Eye size={13} /> Ver Pedido
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm w-full flex justify-center gap-1.5"
                    onClick={() => navigate(`/orders/new?table_id=${table.id}`)}
                  >
                    <Plus size={13} /> Abrir Mesa
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state col-span-full">
            <p>Nenhuma mesa encontrada</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Editar Mesa' : 'Nova Mesa'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Número da Mesa</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ex: 12"
                    value={formNumber}
                    onChange={e => setFormNumber(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
