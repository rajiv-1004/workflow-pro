export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_CANCELLED'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  company_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedNotifications {
  items: NotificationItem[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface UnreadCountResponse {
  count: number;
}
