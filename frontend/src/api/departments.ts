import { apiClient } from './client';
import { PaginatedResponse } from '../types/api';
import {
  Department,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
} from '../types/department';

export interface DepartmentListParams {
  search?: string;
  is_active?: boolean;
  sort_by?: 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export const departmentsApi = {
  list: async (params?: DepartmentListParams): Promise<PaginatedResponse<Department>> => {
    const response = await apiClient.get<PaginatedResponse<Department>>('/departments', {
      params,
    });
    return response.data;
  },

  get: async (id: string): Promise<Department> => {
    const response = await apiClient.get<Department>(`/departments/${id}`);
    return response.data;
  },

  create: async (payload: DepartmentCreatePayload): Promise<Department> => {
    const response = await apiClient.post<Department>('/departments', payload);
    return response.data;
  },

  update: async (id: string, payload: DepartmentUpdatePayload): Promise<Department> => {
    const response = await apiClient.patch<Department>(`/departments/${id}`, payload);
    return response.data;
  },

  deactivate: async (id: string): Promise<Department> => {
    const response = await apiClient.delete<Department>(`/departments/${id}`);
    return response.data;
  },
};
