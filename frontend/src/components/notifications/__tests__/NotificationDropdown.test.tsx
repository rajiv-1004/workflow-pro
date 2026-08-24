import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from '../NotificationDropdown';
import { notificationsApi } from '../../../api/notifications';

vi.mock('../../../api/notifications', () => ({
  notificationsApi: {
    getUnreadCount: vi.fn(),
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

const renderWithProviders = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationDropdown />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('NotificationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification badge with unread count', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 3 });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('opens panel and displays notification list', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 1 });
    vi.mocked(notificationsApi.list).mockResolvedValue({
      items: [
        {
          id: 'n1',
          company_id: 'c1',
          user_id: 'u1',
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: 'You have been assigned to task 1',
          resource_type: 'task',
          resource_id: 't1',
          is_read: false,
          read_at: null,
          created_at: '2026-08-24T10:00:00Z',
          updated_at: '2026-08-24T10:00:00Z',
        },
      ],
      page: 1,
      page_size: 15,
      total: 1,
      pages: 1,
    });

    renderWithProviders();

    const bellBtn = screen.getByRole('button', { name: /open notifications menu/i });
    fireEvent.click(bellBtn);

    await waitFor(() => {
      expect(screen.getByText('New Task Assigned')).toBeInTheDocument();
      expect(screen.getByText('You have been assigned to task 1')).toBeInTheDocument();
    });
  });
});
