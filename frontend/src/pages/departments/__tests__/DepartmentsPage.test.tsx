import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { DepartmentsPage } from '../DepartmentsPage';

vi.mock('../../../api/departments', () => ({
  departmentsApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'dept-1',
          name: 'Engineering',
          description: 'Software and infra team',
          is_active: true,
          company_id: 'comp-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      page: 1,
      page_size: 10,
      total: 1,
      pages: 1,
    }),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('DepartmentsPage Component', () => {
  it('renders department listing and action buttons for admin', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: {
              id: 'u1',
              email: 'admin@company.com',
              full_name: 'Admin User',
              is_active: true,
              company_id: 'comp-1',
              role_id: 'r1',
              role: { id: 'r1', name: 'admin' },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            isLoading: false,
            login: async () => {},
            logout: () => {},
            refreshUser: async () => {},
          }}
        >
          <BrowserRouter>
            <DepartmentsPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create department/i })).toBeInTheDocument();
    expect(await screen.findByText('Engineering')).toBeInTheDocument();
  });
});
