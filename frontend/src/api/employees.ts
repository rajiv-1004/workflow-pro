import { apiClient } from './client';
import { PaginatedResponse } from '../types/api';
import {
  DepartmentAssignmentPayload,
  Employee,
  EmployeeUpdatePayload,
} from '../types/employee';

export interface EmployeeListParams {
  search?: string;
  department_id?: string;
  is_active?: boolean;
  sort_by?: 'full_name' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export const employeesApi = {
  list: async (params?: EmployeeListParams): Promise<PaginatedResponse<Employee>> => {
    const response = await apiClient.get<PaginatedResponse<Employee>>('/employees', {
      params,
    });
    return response.data;
  },

  get: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  update: async (id: string, payload: EmployeeUpdatePayload): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}`, payload);
    return response.data;
  },

  assignDepartment: async (
    id: string,
    payload: DepartmentAssignmentPayload
  ): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(
      `/employees/${id}/department`,
      payload
    );
    return response.data;
  },

  deactivate: async (id: string): Promise<Employee> => {
    const response = await apiClient.patch<Employee>(`/employees/${id}/deactivate`);
    return response.data;
  },
};
