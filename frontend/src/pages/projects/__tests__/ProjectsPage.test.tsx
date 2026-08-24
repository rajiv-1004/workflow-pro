import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { ProjectsPage } from '../ProjectsPage';

vi.mock('../../../api/projects', () => ({
  projectsApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'proj-1',
          name: 'Core SaaS Platform',
          description: 'Multi-tenant architecture delivery',
          status: 'ACTIVE',
          start_date: new Date().toISOString(),
          due_date: new Date().toISOString(),
          is_active: true,
          company_id: 'comp-1',
          department_id: null,
          manager_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      page: 1,
      page_size: 9,
      total: 1,
      pages: 1,
    }),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    deactivate: vi.fn(),
  },
}));

vi.mock('../../../api/departments', () => ({
  departmentsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ProjectsPage Component', () => {
  it('renders projects cards and badges', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: {
              id: 'u1',
              email: 'manager@company.com',
              full_name: 'Manager User',
              is_active: true,
              company_id: 'comp-1',
              role_id: 'r2',
              role: { id: 'r2', name: 'manager' },
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
            <ProjectsPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(await screen.findByText('Core SaaS Platform')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });
});
