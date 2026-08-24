import { apiClient } from './client';
import { PaginatedResponse } from '../types/api';
import {
  Task,
  TaskAssignmentPayload,
  TaskCreatePayload,
  TaskPriority,
  TaskStatus,
  TaskStatusUpdatePayload,
  TaskUpdatePayload,
} from '../types/task';

export interface TaskListParams {
  search?: string;
  project_id?: string;
  assigned_to_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  is_active?: boolean;
  sort_by?: 'title' | 'status' | 'priority' | 'due_date' | 'completed_at' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export const tasksApi = {
  list: async (params?: TaskListParams): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks', {
      params,
    });
    return response.data;
  },

  get: async (id: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  create: async (payload: TaskCreatePayload): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', payload);
    return response.data;
  },

  update: async (id: string, payload: TaskUpdatePayload): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, payload);
    return response.data;
  },

  updateStatus: async (
    id: string,
    payload: TaskStatusUpdatePayload
  ): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, payload);
    return response.data;
  },

  assign: async (id: string, payload: TaskAssignmentPayload): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/assign`, payload);
    return response.data;
  },

  complete: async (id: string): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/complete`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/deactivate`);
    return response.data;
  },
};
