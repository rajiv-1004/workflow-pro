import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../contexts/AuthContext';
import { AttendancePage } from '../AttendancePage';
import { attendanceApi } from '../../../api/attendance';
import { formatMinutesToDuration } from '../../../utils/formatters';

vi.mock('../../../api/attendance', () => ({
  attendanceApi: {
    checkIn: vi.fn(),
    checkOut: vi.fn(),
    getMyAttendance: vi.fn(),
    getMySummary: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../../../api/employees', () => ({
  employeesApi: {
    list: vi.fn().mockResolvedValue({
      items: [{ id: 'u1', full_name: 'Employee One' }],
      total: 1,
    }),
  },
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const mockUser = {
  id: 'u1',
  email: 'employee@company.com',
  full_name: 'Employee User',
  is_active: true,
  company_id: 'comp-1',
  role_id: 'r3',
  role: { id: 'r3', name: 'employee' as const },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('AttendancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies duration formatter utility with various inputs', () => {
    expect(formatMinutesToDuration(0)).toBe('0m');
    expect(formatMinutesToDuration(30)).toBe('30m');
    expect(formatMinutesToDuration(60)).toBe('1h');
    expect(formatMinutesToDuration(90)).toBe('1h 30m');
    expect(formatMinutesToDuration(485)).toBe('8h 5m');
  });

  it('renders attendance action card with check-in button when not checked in', async () => {
    vi.mocked(attendanceApi.getMyAttendance).mockResolvedValue({
      items: [],
      page: 1,
      page_size: 10,
      total: 0,
      pages: 0,
    });

    vi.mocked(attendanceApi.getMySummary).mockResolvedValue({
      total_days: 15,
      present_days: 14,
      late_days: 1,
      total_working_minutes: 7200,
      average_working_minutes: 480,
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: mockUser,
            isLoading: false,
            login: async () => {},
            logout: () => {},
            refreshUser: async () => {},
          }}
        >
          <BrowserRouter>
            <AttendancePage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    expect(screen.getByText("Today's Attendance")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check in now/i })).toBeInTheDocument();
    expect(await screen.findByText('Monthly Attendance Summary')).toBeInTheDocument();
    expect(await screen.findByText('14')).toBeInTheDocument(); // Present days
  });

  it('renders active check-in state with check-out button', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    vi.mocked(attendanceApi.getMyAttendance).mockResolvedValue({
      items: [
        {
          id: 'att-1',
          company_id: 'comp-1',
          employee_id: 'u1',
          attendance_date: todayStr,
          check_in: nowIso,
          check_out: null,
          working_minutes: 0,
          status: 'PRESENT',
          is_late: false,
          late_minutes: 0,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ],
      page: 1,
      page_size: 10,
      total: 1,
      pages: 1,
    });

    vi.mocked(attendanceApi.getMySummary).mockResolvedValue({
      total_days: 1,
      present_days: 1,
      late_days: 0,
      total_working_minutes: 480,
      average_working_minutes: 480,
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider
          value={{
            accessToken: 'mock-token',
            isAuthenticated: true,
            user: mockUser,
            isLoading: false,
            login: async () => {},
            logout: () => {},
            refreshUser: async () => {},
          }}
        >
          <BrowserRouter>
            <AttendancePage />
          </BrowserRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Working Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check out now/i })).toBeInTheDocument();
  });
});
