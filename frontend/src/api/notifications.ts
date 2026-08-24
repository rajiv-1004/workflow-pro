import { apiClient } from './client';
import { NotificationItem, PaginatedNotifications, UnreadCountResponse } from '../types/notification';

export const notificationsApi = {
  list: async (params?: { is_read?: boolean; page?: number; page_size?: number }): Promise<PaginatedNotifications> => {
    const response = await apiClient.get<PaginatedNotifications>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const response = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.patch<UnreadCountResponse>('/notifications/read-all');
    return response.data;
  },
};
