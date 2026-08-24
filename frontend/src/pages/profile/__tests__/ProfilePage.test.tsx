import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { ProfilePage } from '../ProfilePage';
import { profileApi } from '../../../api/profile';

vi.mock('../../../api/profile', () => ({
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const mockUser = {
  id: 'u123',
  email: 'employee@company.com',
  full_name: 'Employee Name',
  is_active: true,
  company_id: 'comp-123',
  role_id: 'role-123',
  role: { id: 'role-123', name: 'employee' as const },
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

const renderWithProviders = (user = mockUser) => {
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
          <ProfilePage />
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user details and tenancy information', () => {
    renderWithProviders();

    expect(screen.getByText('Profile & Account Security')).toBeInTheDocument();
    expect(screen.getByText('Employee Name')).toBeInTheDocument();
    expect(screen.getAllByText('employee@company.com').length).toBeGreaterThan(0);
    expect(screen.getByText('comp-123')).toBeInTheDocument();
  });

  it('submits profile full_name update', async () => {
    vi.mocked(profileApi.updateProfile).mockResolvedValue({
      id: 'u123',
      email: 'employee@company.com',
      full_name: 'Updated Name',
      is_active: true,
      company_id: 'comp-123',
      role_id: 'role-123',
      role_name: 'employee',
      company_name: 'Test Corp',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    });

    renderWithProviders();

    const nameInput = screen.getByPlaceholderText('Your full name');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

    const saveBtn = screen.getByRole('button', { name: /save profile changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(profileApi.updateProfile).toHaveBeenCalledWith({ full_name: 'Updated Name' });
    });
  });

  it('validates password change mismatch', async () => {
    renderWithProviders();

    const currentInput = screen.getByPlaceholderText('••••••••');
    const newInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Repeat new password');

    fireEvent.change(currentInput, { target: { value: 'Password123' } });
    fireEvent.change(newInput, { target: { value: 'NewPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'MismatchPassword123' } });

    const updatePasswordBtn = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updatePasswordBtn);

    await waitFor(() => {
      expect(screen.getByText(/new password and confirmation do not match/i)).toBeInTheDocument();
    });
  });
});
