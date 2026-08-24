import { apiClient } from './client';
import {
  AttendanceReportParams,
  EmployeeReportParams,
  ProjectReportParams,
  TaskReportParams,
} from '../types/report';

const downloadBlob = (data: BlobPart, filename: string) => {
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reportsApi = {
  exportEmployees: async (params?: EmployeeReportParams): Promise<void> => {
    const response = await apiClient.get('/reports/employees/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, 'employees_report.xlsx');
  },

  exportProjects: async (params?: ProjectReportParams): Promise<void> => {
    const response = await apiClient.get('/reports/projects/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, 'projects_report.xlsx');
  },

  exportTasks: async (params?: TaskReportParams): Promise<void> => {
    const response = await apiClient.get('/reports/tasks/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, 'tasks_report.xlsx');
  },

  exportAttendance: async (params?: AttendanceReportParams): Promise<void> => {
    const response = await apiClient.get('/reports/attendance/export', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, 'attendance_report.xlsx');
  },
};
