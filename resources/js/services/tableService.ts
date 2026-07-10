import api from './api';
import type { Table } from '../types';

export const tableService = {
  async list(): Promise<Table[]> {
    const response = await api.get<Table[]>('/tables');
    return response.data;
  },

  async get(id: number): Promise<Table> {
    const response = await api.get<Table>(`/tables/${id}`);
    return response.data;
  },

  async create(data: { number: number }): Promise<Table> {
    const response = await api.post<Table>('/tables', data);
    return response.data;
  },

  async update(id: number, data: { number?: number; status?: string }): Promise<Table> {
    const response = await api.put<Table>(`/tables/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/tables/${id}`);
  },
};
