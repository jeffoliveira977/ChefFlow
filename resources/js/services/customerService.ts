import api from './api';
import type { Customer } from '../types';

export const customerService = {
  async list(): Promise<Customer[]> {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  },

  async get(id: number): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async create(data: { name: string; cpf: string }): Promise<Customer> {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  async update(id: number, data: { name?: string; cpf?: string }): Promise<Customer> {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async getLargestOrder(id: number) {
    const response = await api.get(`/customers/${id}/orders/largest`);
    return response.data;
  },

  async getFirstOrder(id: number) {
    const response = await api.get(`/customers/${id}/orders/first`);
    return response.data;
  },

  async getLatestOrder(id: number) {
    const response = await api.get(`/customers/${id}/orders/latest`);
    return response.data;
  },
};
