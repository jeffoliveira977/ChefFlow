import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, User } from 'lucide-react';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';
import { toast } from '../components/Toast';

import { useCache } from '../contexts/CacheContext';

const formatCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const CustomersPage = () => {
  const { cache, setCache } = useCache();
  const [customers, setCustomers] = useState<Customer[]>(cache['customers_list'] || []);
  const [loading, setLoading] = useState(!cache['customers_list']);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', cpf: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await customerService.list();
      setCustomers(data);
      setCache('customers_list', data);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', cpf: '' });
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, cpf: c.cpf });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await customerService.update(editing.id, form);
        toast.success('Cliente atualizado!');
      } else {
        await customerService.create(form);
        toast.success('Cliente cadastrado!');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (!confirm(`Excluir cliente ${c.name}?`)) return;
    try {
      await customerService.delete(c.id);
      toast.success('Cliente excluído');
      load();
    } catch {
      toast.error('Erro ao excluir cliente');
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search)
  );

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" />Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p>{customers.length} clientes cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Novo Cliente
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card !p-0">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th className="w-[100px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                        <User size={14} color="var(--text-muted)" />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="text-[var(--text-secondary)] font-mono">
                    {formatCPF(c.cpf)}
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}>
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon text-[var(--status-cancelled)]"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty-state">
                      <User size={32} />
                      <p>Nenhum cliente encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Editar Cliente' : 'Novo Cliente'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body flex flex-col gap-3.5">
                <div className="form-group">
                  <label>Nome completo</label>
                  <input
                    placeholder="Ex: João da Silva"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>CPF</label>
                  <input
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
