import { apiClient } from './client';
import { PaginatedResponse } from '../types/api';
import {
  Project,
  ProjectCreatePayload,
  ProjectStatus,
  ProjectStatusUpdatePayload,
  ProjectUpdatePayload,
} from '../types/project';

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus;
  department_id?: string;
  manager_id?: string;
  is_active?: boolean;
  sort_by?: 'name' | 'status' | 'start_date' | 'due_date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export const projectsApi = {
  list: async (params?: ProjectListParams): Promise<PaginatedResponse<Project>> => {
    const response = await apiClient.get<PaginatedResponse<Project>>('/projects', {
      params,
    });
    return response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (payload: ProjectCreatePayload): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', payload);
    return response.data;
  },

  update: async (id: string, payload: ProjectUpdatePayload): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}`, payload);
    return response.data;
  },

  updateStatus: async (
    id: string,
    payload: ProjectStatusUpdatePayload
  ): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}/status`, payload);
    return response.data;
  },

  deactivate: async (id: string): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}/deactivate`);
    return response.data;
  },
};
