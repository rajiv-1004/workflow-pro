import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { ReportsPage } from '../ReportsPage';
import { reportsApi } from '../../../api/reports';

vi.mock('../../../api/reports', () => ({
  reportsApi: {
    exportEmployees: vi.fn(),
    exportProjects: vi.fn(),
    exportTasks: vi.fn(),
    exportAttendance: vi.fn(),
  },
}));

vi.mock('../../../api/departments', () => ({
  departmentsApi: {
    list: vi.fn().mockResolvedValue([
      { id: 'd1', name: 'Engineering' },
      { id: 'd2', name: 'Sales' },
    ]),
  },
}));

vi.mock('../../../api/projects', () => ({
  projectsApi: {
    list: vi.fn().mockResolvedValue({
      items: [{ id: 'p1', name: 'SaaS Launch' }],
      total: 1,
    }),
  },
}));

const mockAdminUser = {
  id: 'u1',
  email: 'admin@company.com',
  full_name: 'Admin User',
  is_active: true,
  company_id: 'comp-1',
  role_id: 'r1',
  role: { id: 'r1', name: 'admin' as const },
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

const renderWithProviders = (user = mockAdminUser) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          accessToken: 'mock-token',
          isAuthenticated: true,
          isLoading: false,
          login: vi.fn(),
          logout: vi.fn(),
          refreshUser: vi.fn().mockResolvedValue(undefined),
        }}
      >
        <BrowserRouter>
          <ReportsPage />
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders report tabs and options for admin', () => {
    renderWithProviders();

    expect(screen.getByText('Enterprise Reports & Excel Export')).toBeInTheDocument();
    expect(screen.getByText('Employee Directory')).toBeInTheDocument();
    expect(screen.getByText('Project Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Tasks & Assignments')).toBeInTheDocument();
    expect(screen.getByText('Attendance & Punctuality')).toBeInTheDocument();
  });

  it('triggers employee export download', async () => {
    vi.mocked(reportsApi.exportEmployees).mockResolvedValue(undefined);

    renderWithProviders();

    const exportBtn = screen.getByRole('button', { name: /download employees/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(reportsApi.exportEmployees).toHaveBeenCalled();
    });
  });

  it('switches tabs to tasks report', async () => {
    renderWithProviders();

    const tasksTab = screen.getByText('Tasks & Assignments');
    fireEvent.click(tasksTab);

    expect(screen.getByText('tasks Export Configuration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download tasks/i })).toBeInTheDocument();
  });
});
