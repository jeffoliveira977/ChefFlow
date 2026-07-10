import api from './api';
import type { Order, CreateOrderPayload, OrderFilters, OrderStatus } from '../types';

export const orderService = {
  async list(filters?: OrderFilters): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders', { params: filters });
    return response.data;
  },

  async get(id: number): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  async create(data: CreateOrderPayload): Promise<Order> {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  async update(id: number, data: { status?: OrderStatus; notes?: string }): Promise<Order> {
    const response = await api.put<Order>(`/orders/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/orders/${id}`);
  },

  async getWaiterOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/waiters');
    return response.data;
  },

  async getCookOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/cooks');
    return response.data;
  },
};
