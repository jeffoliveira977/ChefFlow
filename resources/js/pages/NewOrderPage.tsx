import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Trash2, ShoppingBag } from 'lucide-react';
import { tableService } from '../services/tableService';
import { customerService } from '../services/customerService';
import { menuService } from '../services/menuService';
import { orderService } from '../services/orderService';
import type { Table, Customer, MenuItem, MenuCategory } from '../types';
import { toast } from '../components/Toast';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

import { useCache } from '../contexts/CacheContext';

const NewOrderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableIdParam = searchParams.get('table_id') || '';
  const { cache, setCache } = useCache();

  const [tables, setTables] = useState<Table[]>(cache['new_order_tables'] || []);
  const [customers, setCustomers] = useState<Customer[]>(cache['new_order_customers'] || []);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(cache['new_order_menu_items'] || []);
  const [categories, setCategories] = useState<MenuCategory[]>(cache['new_order_categories'] || []);
  const [loading, setLoading] = useState(!cache['new_order_tables']);

  const [selectedTable, setSelectedTable] = useState(tableIdParam);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, c, items, cats] = await Promise.all([
          tableService.list(),
          customerService.list(),
          menuService.listItems(),
          menuService.listCategories(),
        ]);
        setTables(t);
        setCustomers(c);
        setMenuItems(items);
        setCategories(cats);
        setCache('new_order_tables', t);
        setCache('new_order_customers', c);
        setCache('new_order_menu_items', items);
        setCache('new_order_categories', cats);
      } catch {
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addToCart = (item: MenuItem) => {
    if (!item.available) { toast.error('Item indisponível'); return; }
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== itemId));
  };

  const changeQty = (itemId: number, delta: number) => {
    setCart(prev => prev
      .map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + Number(c.menuItem.price) * c.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedTable) { toast.error('Selecione uma mesa'); return; }
    if (!selectedCustomer) { toast.error('Selecione um cliente'); return; }
    if (cart.length === 0) { toast.error('Adicione ao menos um item'); return; }

    setSubmitting(true);
    try {
      const order = await orderService.create({
        table_id: Number(selectedTable),
        customer_id: Number(selectedCustomer),
        notes: notes || undefined,
        items: cart.map(c => ({ menu_item_id: c.menuItem.id, quantity: c.quantity })),
      });
      toast.success(`Pedido #${order.id} criado com sucesso!`);
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchCat = activeCategory === 'all' || item.category_id === activeCategory;
    return matchSearch && matchCat && item.available;
  });

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" />Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Novo Pedido</h2>
          <p>Selecione mesa, cliente e itens do cardápio</p>
        </div>
      </div>

      <div className="order-builder">
        <div>
          <div className="card mb-5">
            <div className="card-title mb-3.5">Informações do Pedido</div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="form-group">
                <label>Mesa</label>
                <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                  <option value="">Selecione a mesa...</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                      Mesa {t.number} {t.status === 'occupied' ? '(Ocupada)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cliente</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                  <option value="">Selecione o cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group mt-3.5">
              <label>Observações</label>
              <textarea
                placeholder="Ex: Sem cebola, alérgico a camarão..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>

          <div className="card ">
            <div className="card-title mb-3.5">Cardápio</div>

            <div className="flex gap-2 mb-3 flex-wrap">
              <div className="search-input-wrap flex-1 min-w-[180px]">
                <Search size={14} />
                <input
                  placeholder="Buscar item..."
                  value={menuSearch}
                  onChange={e => setMenuSearch(e.target.value)}
                />
              </div>
              <button
                className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategory('all')}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.menuItem.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`menu-item-card text-left cursor-pointer ${inCart ? 'ring-1 ring-[var(--amber-500)] border-[var(--amber-500)]' : ''}`}
                  >
                    <span className="menu-item-name">
                      {item.name}
                      {inCart && <span className="text-[var(--amber-400)] ml-1.5">×{inCart.quantity}</span>}
                    </span>
                    <span className="menu-item-price">
                      {formatCurrency(Number(item.price))}
                    </span>
                  </button>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="empty-state col-span-full !p-6">
                  <p>Nenhum item disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="order-cart">
          <div className="cart-header">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} color="var(--amber-400)" />
              Carrinho
            </div>
            <span className="text-xs text-[var(--text-muted)]">{cart.length} itens</span>
          </div>

          <div className="cart-items">
            {cart.length === 0 && (
              <div className="cart-empty">
                Selecione itens do cardápio
              </div>
            )}
            {cart.map(c => (
              <div key={c.menuItem.id} className="cart-item">
                <div className="cart-item-name">{c.menuItem.name}</div>
                <div className="cart-qty-ctrl">
                  <button className="qty-btn" onClick={() => changeQty(c.menuItem.id, -1)}>−</button>
                  <span className="qty-value">{c.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(c.menuItem.id, +1)}>+</button>
                </div>
                <span className="cart-item-price">
                  {formatCurrency(Number(c.menuItem.price) * c.quantity)}
                </span>
                <button
                  onClick={() => removeFromCart(c.menuItem.id)}
                  className="bg-none border-none cursor-pointer text-[var(--text-muted)] flex p-0.5"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">{formatCurrency(total)}</span>
            </div>
            <button
              className="btn btn-primary w-full"
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0 || !selectedTable || !selectedCustomer}
            >
              {submitting ? 'Enviando pedido...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;
