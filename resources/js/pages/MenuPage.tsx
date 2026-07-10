import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, X,
  Clock, Tag, ToggleLeft, ToggleRight
} from 'lucide-react';
import { menuService } from '../services/menuService';
import type { MenuItem, MenuCategory } from '../types';
import { toast } from '../components/Toast';

import { useCache } from '../contexts/CacheContext';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

type ItemForm = {
  name: string;
  description: string;
  price: string;
  category_id: string;
  available: boolean;
  preparation_time: string;
};

const MenuPage = () => {
  const { cache, setCache } = useCache();
  const [items, setItems] = useState<MenuItem[]>(cache['menu_items_list'] || []);
  const [categories, setCategories] = useState<MenuCategory[]>(cache['menu_categories_list'] || []);
  const [loading, setLoading] = useState(!cache['menu_items_list']);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>({
    name: '', description: '', price: '', category_id: '',
    available: true, preparation_time: '15',
  });
  const [savingItem, setSavingItem] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [savingCat, setSavingCat] = useState(false);

  const load = async () => {
    try {
      const [itemsData, catsData] = await Promise.all([
        menuService.listItems(),
        menuService.listCategories(),
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setCache('menu_items_list', itemsData);
      setCache('menu_categories_list', catsData);
    } catch {
      toast.error('Erro ao carregar cardápio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ name: '', description: '', price: '', category_id: categories[0]?.id ? String(categories[0].id) : '', available: true, preparation_time: '15' });
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category_id: String(item.category_id),
      available: item.available,
      preparation_time: String(item.preparation_time),
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingItem(true);

    const payload = {
      name: itemForm.name,
      description: itemForm.description,
      price: Number(itemForm.price),
      category_id: Number(itemForm.category_id),
      available: itemForm.available,
      preparation_time: Number(itemForm.preparation_time),
    };

    try {

      if (editingItem) {
        await menuService.updateItem(editingItem.id, payload);
        toast.success('Item atualizado!');
      } else {
        await menuService.createItem(payload);
        toast.success('Item criado!');
      }

      setShowItemModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Excluir "${item.name}"?`)) return;

    try {
      await menuService.deleteItem(item.id);
      toast.success('Item excluído');
      load();
    } catch {
      toast.error('Erro ao excluir item');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await menuService.updateItem(item.id, { available: !item.available });
      toast.info(!item.available ? 'Item disponibilizado' : 'Item indisponibilizado');
      load();
    } catch {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);

    try {

      if (editingCat) {
        await menuService.updateCategory(editingCat.id, catForm);
        toast.success('Categoria atualizada!');
      } else {
        await menuService.createCategory(catForm);
        toast.success('Categoria criada!');
      }

      setShowCatModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar categoria');
    } finally {
      setSavingCat(false);
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory;
    return matchSearch && matchCat;
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" />Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Cardápio</h2>
          <p>{items.length} itens · {categories.length} categorias</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => {
            setEditingCat(null);
            setCatForm({ name: '', description: '' });
            setShowCatModal(true);
          }}>
            <Tag size={15} /> Nova Categoria
          </button>
          <button className="btn btn-primary" onClick={openCreateItem}>
            <Plus size={15} /> Novo Item
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap max-w-[300px]">
          <Search size={15} />
          <input
            placeholder="Buscar item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button
          className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveCategory('all')}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filtered.map(item => (
          <div key={item.id} className="menu-item-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="menu-item-name">{item.name}</div>
                <div className="text-[11.5px] text-[var(--amber-500)] font-semibold mt-0.5">
                  {categories.find(c => c.id === item.category_id)?.name}
                </div>
              </div>
              <button
                onClick={() => handleToggleAvailable(item)}
                className={`bg-none border-none cursor-pointer flex ${item.available ? 'text-[#4ade80]' : 'text-[var(--text-muted)]'}`}
                title={item.available ? 'Disponível (clique para indisponibilizar)' : 'Indisponível (clique para disponibilizar)'}
              >
                {item.available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>

            {item.description && (
              <p className="menu-item-desc">{item.description}</p>
            )}

            <div className="menu-item-footer">
              <span className="menu-item-price">{formatCurrency(Number(item.price))}</span>
              <div className="flex items-center gap-2.5">
                <span className="menu-item-meta">
                  <Clock size={11} /> {item.preparation_time}min
                </span>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditItem(item)}>
                  <Pencil size={12} />
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon text-[var(--status-cancelled)]"
                  onClick={() => handleDeleteItem(item)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state col-span-full">
            <p>Nenhum item encontrado</p>
          </div>
        )}
      </div>

      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? 'Editar Item' : 'Novo Item do Cardápio'}</span>
              <button className="modal-close" onClick={() => setShowItemModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div className="modal-body flex flex-col gap-3.5">
                <div className="form-group">
                  <label>Nome</label>
                  <input
                    placeholder="Ex: Feijoada"
                    value={itemForm.name}
                    onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                    required autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    placeholder="Descrição do item..."
                    value={itemForm.description}
                    onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label>Preço (R$)</label>
                    <input
                      type="number" step="0.01" min="0"
                      placeholder="0,00"
                      value={itemForm.price}
                      onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tempo de Preparo (min)</label>
                    <input
                      type="number" min="1"
                      placeholder="15"
                      value={itemForm.preparation_time}
                      onChange={e => setItemForm(f => ({ ...f, preparation_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    value={itemForm.category_id}
                    onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="available"
                    checked={itemForm.available}
                    onChange={e => setItemForm(f => ({ ...f, available: e.target.checked }))}
                    className="!w-auto"
                  />
                  <label htmlFor="available" className="!mb-0">Disponível no cardápio</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingItem}>
                  {savingItem ? 'Salvando...' : editingItem ? 'Atualizar' : 'Criar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</span>
              <button className="modal-close" onClick={() => setShowCatModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveCat}>
              <div className="modal-body flex flex-col gap-3.5">
                <div className="form-group">
                  <label>Nome da Categoria</label>
                  <input
                    placeholder="Ex: Bebidas"
                    value={catForm.name}
                    onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                    required autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <input
                    placeholder="Descrição opcional..."
                    value={catForm.description}
                    onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingCat}>
                  {savingCat ? 'Salvando...' : editingCat ? 'Atualizar' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
