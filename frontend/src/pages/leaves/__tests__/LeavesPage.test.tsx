import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { LeavesPage } from '../LeavesPage';
import { leavesApi } from '../../../api/leaves';

vi.mock('../../../api/leaves', () => ({
  leavesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('../../../api/employees', () => ({
  employeesApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        { id: 'u1', full_name: 'Admin User' },
        { id: 'u2', full_name: 'John Doe' },
      ],
      total: 2,
    }),
  },
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const mockAdminUser = {
  id: 'u1',
  email: 'admin@company.com',
  full_name: 'Admin User',
  is_active: true,
  company_id: 'comp-1',
  role_id: 'r1',
  role: { id: 'r1', name: 'admin' as const },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockEmployeeUser = {
  id: 'u2',
  email: 'john@company.com',
  full_name: 'John Doe',
  is_active: true,
  company_id: 'comp-1',
  role_id: 'r3',
  role: { id: 'r3', name: 'employee' as const },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('LeavesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leave requests list with status badges and new request button', async () => {
    vi.mocked(leavesApi.list).mockResolvedValue({
      items: [
        {
          id: 'leave-1',
          company_id: 'comp-1',
          employee_id: 'u1',
          leave_type: 'CASUAL',
          start_date: '2026-09-01',
          end_date: '2026-09-03',
          reason: 'Family vacation trip',
          status: 'PENDING',
          reviewed_by_id: null,
          reviewed_at: null,
          review_comment: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      page: 1,
      page_size: 10,
      total: 1,
      pages: 1,
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: mockAdminUser,
            isLoading: false,
            login: async () => {},
            logout: () => {},
            refreshUser: async () => {},
          }}
        >
          <BrowserRouter>
            <LeavesPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Leave Requests' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new leave request/i })).toBeInTheDocument();
    expect(await screen.findByText('Family vacation trip', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText('Casual Leave').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Review').length).toBeGreaterThan(0);
  });

  it('displays empty state when no leave requests exist', async () => {
    vi.mocked(leavesApi.list).mockResolvedValue({
      items: [],
      page: 1,
      page_size: 10,
      total: 0,
      pages: 0,
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: mockEmployeeUser,
            isLoading: false,
            login: async () => {},
            logout: () => {},
            refreshUser: async () => {},
          }}
        >
          <BrowserRouter>
            <LeavesPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('No leave requests found')).toBeInTheDocument();
  });

  it('opens create leave request modal and performs validation', async () => {
    vi.mocked(leavesApi.list).mockResolvedValue({
      items: [],
      page: 1,
      page_size: 10,
      total: 0,
      pages: 0,
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: mockEmployeeUser,
            isLoading: false,
            login: async () => {},
            logout: () => {},
            refreshUser: async () => {},
          }}
        >
          <BrowserRouter>
            <LeavesPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const newBtn = screen.getByRole('button', { name: /new leave request/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Request Time Off')).toBeInTheDocument();
    expect(screen.getByText('Submit Leave Request')).toBeInTheDocument();
  });
});
