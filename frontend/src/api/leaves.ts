import { apiClient } from './client';
import {
  LeaveRequest,
  LeaveCreatePayload,
  LeaveUpdatePayload,
  LeaveReviewPayload,
  PaginatedLeaveResponse,
  LeaveListParams,
} from '../types/leave';

export const leavesApi = {
  list: async (params?: LeaveListParams): Promise<PaginatedLeaveResponse> => {
    const response = await apiClient.get<PaginatedLeaveResponse>('/leaves', { params });
    return response.data;
  },

  get: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.get<LeaveRequest>(`/leaves/${id}`);
    return response.data;
  },

  create: async (payload: LeaveCreatePayload): Promise<LeaveRequest> => {
    const response = await apiClient.post<LeaveRequest>('/leaves', payload);
    return response.data;
  },

  update: async (id: string, payload: LeaveUpdatePayload): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/${id}`, payload);
    return response.data;
  },

  approve: async (id: string, payload?: LeaveReviewPayload): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/${id}/approve`, payload || {});
    return response.data;
  },

  reject: async (id: string, payload?: LeaveReviewPayload): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/${id}/reject`, payload || {});
    return response.data;
  },

  cancel: async (id: string): Promise<LeaveRequest> => {
    const response = await apiClient.patch<LeaveRequest>(`/leaves/${id}/cancel`);
    return response.data;
  },
};
