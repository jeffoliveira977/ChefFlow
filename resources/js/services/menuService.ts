import api from './api';
import type { MenuCategory, MenuItem } from '../types';

export const menuService = {
 
  async listCategories(): Promise<MenuCategory[]> {
    const response = await api.get<MenuCategory[]>('/menu/categories');
    return response.data;
  },

  async createCategory(data: { name: string; description?: string }): Promise<MenuCategory> {
    const response = await api.post<MenuCategory>('/menu/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: { name?: string; description?: string }): Promise<MenuCategory> {
    const response = await api.put<MenuCategory>(`/menu/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/menu/categories/${id}`);
  },

  async listItems(): Promise<MenuItem[]> {
    const response = await api.get<MenuItem[]>('/menu/items');
    return response.data;
  },

  async createItem(data: {
    name: string;
    description?: string;
    price: number;
    category_id: number;
    available: boolean;
    preparation_time: number;
  }): Promise<MenuItem> {
    const response = await api.post<MenuItem>('/menu/items', data);
    return response.data;
  },

  async updateItem(id: number, data: Partial<{
    name: string;
    description: string;
    price: number;
    category_id: number;
    available: boolean;
    preparation_time: number;
  }>): Promise<MenuItem> {
    const response = await api.put<MenuItem>(`/menu/items/${id}`, data);
    return response.data;
  },

  async deleteItem(id: number): Promise<void> {
    await api.delete(`/menu/items/${id}`);
  },
};
