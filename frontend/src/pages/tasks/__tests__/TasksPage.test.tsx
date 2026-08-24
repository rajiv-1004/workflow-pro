import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { TasksPage } from '../TasksPage';

vi.mock('../../../api/tasks', () => ({
  tasksApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'task-1',
          title: 'Setup Database Migrations',
          description: 'Alembic migration revision chain',
          status: 'TODO',
          priority: 'HIGH',
          due_date: new Date().toISOString(),
          completed_at: null,
          is_active: true,
          project_id: 'proj-1',
          company_id: 'comp-1',
          assigned_to_id: 'u1',
          created_by_id: 'u1',
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
    updateStatus: vi.fn(),
    assign: vi.fn(),
    complete: vi.fn(),
    deactivate: vi.fn(),
  },
}));

vi.mock('../../../api/projects', () => ({
  projectsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}));

vi.mock('../../../api/employees', () => ({
  employeesApi: {
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

describe('TasksPage Component', () => {
  it('renders tasks listing with priority and status badges', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: {
              id: 'u1',
              email: 'employee@company.com',
              full_name: 'Employee User',
              is_active: true,
              company_id: 'comp-1',
              role_id: 'r3',
              role: { id: 'r3', name: 'employee' },
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
            <TasksPage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(await screen.findByText('Setup Database Migrations')).toBeInTheDocument();
    expect(screen.getAllByText('High').length).toBeGreaterThan(0);
    expect(screen.getAllByText('To Do').length).toBeGreaterThan(0);
  });
});
