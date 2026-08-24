import { apiClient } from './client';
import {
  AttendanceRecord,
  PaginatedAttendanceResponse,
  AttendanceSummary,
  AttendanceListParams,
  AttendanceSummaryParams,
} from '../types/attendance';

export const attendanceApi = {
  checkIn: async (): Promise<AttendanceRecord> => {
    const response = await apiClient.post<AttendanceRecord>('/attendance/check-in');
    return response.data;
  },

  checkOut: async (): Promise<AttendanceRecord> => {
    const response = await apiClient.patch<AttendanceRecord>('/attendance/check-out');
    return response.data;
  },

  getMyAttendance: async (params?: AttendanceListParams): Promise<PaginatedAttendanceResponse> => {
    const response = await apiClient.get<PaginatedAttendanceResponse>('/attendance/me', { params });
    return response.data;
  },

  getMySummary: async (params?: AttendanceSummaryParams): Promise<AttendanceSummary> => {
    const response = await apiClient.get<AttendanceSummary>('/attendance/summary/me', { params });
    return response.data;
  },

  list: async (params?: AttendanceListParams): Promise<PaginatedAttendanceResponse> => {
    const response = await apiClient.get<PaginatedAttendanceResponse>('/attendance', { params });
    return response.data;
  },

  get: async (id: string): Promise<AttendanceRecord> => {
    const response = await apiClient.get<AttendanceRecord>(`/attendance/${id}`);
    return response.data;
  },
};
