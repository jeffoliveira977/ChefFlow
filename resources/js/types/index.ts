export interface User {
  id: number;
  name: string;
  email: string;
  role: 'waiter' | 'cook';
}

export interface Customer {
  id: number;
  name: string;
  cpf: string;
}

export interface Table {
  id: number;
  number: number;
  status: 'available' | 'occupied';
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category_id: number;
  category?: MenuCategory;
  available: boolean;
  preparation_time: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menuItem?: MenuItem;
  menu_item?: MenuItem;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  table_id: number;
  customer_id: number;
  waiter_id: number;
  table?: Table;
  customer?: Customer;
  waiter?: User;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}

export interface OrderFilters {
  period?: 'day' | 'week' | 'month';
  table_id?: number;
  customer_id?: number;
}

export interface CreateOrderPayload {
  table_id: number;
  customer_id: number;
  notes?: string;
  items: { menu_item_id: number; quantity: number; notes?: string }[];
}
