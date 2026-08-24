import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';
import { ProtectedRoute } from '../ProtectedRoute';

describe('ProtectedRoute Component', () => {
  it('redirects to /login when user is not authenticated', () => {
    render(
      <AuthContext.Provider
        value={{
          accessToken: null,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          login: async () => {},
          logout: () => {},
          refreshUser: async () => {},
        }}
      >
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page View</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard Secret Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page View')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Secret Content')).not.toBeInTheDocument();
  });

  it('renders protected outlet content when user is authenticated', () => {
    render(
      <AuthContext.Provider
        value={{
          accessToken: 'mock-valid-jwt-token',
          isAuthenticated: true,
          user: {
            id: '123',
            email: 'admin@company.com',
            full_name: 'Admin User',
            is_active: true,
            company_id: 'comp-1',
            role_id: 'role-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          isLoading: false,
          login: async () => {},
          logout: () => {},
          refreshUser: async () => {},
        }}
      >
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>Login Page View</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard Secret Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Dashboard Secret Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page View')).not.toBeInTheDocument();
  });
});
