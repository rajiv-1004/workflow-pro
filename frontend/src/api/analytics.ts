import { apiClient } from './client';
import { DashboardAnalyticsResponse } from '../types/analytics';

export const analyticsApi = {
  getDashboardAnalytics: async (): Promise<DashboardAnalyticsResponse> => {
    const response = await apiClient.get<DashboardAnalyticsResponse>('/dashboard/analytics');
    return response.data;
  },
};
