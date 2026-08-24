import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalSearchBar } from '../GlobalSearchBar';
import { searchApi } from '../../../api/search';

vi.mock('../../../api/search', () => ({
  searchApi: {
    search: vi.fn(),
  },
}));

describe('GlobalSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <BrowserRouter>
        <GlobalSearchBar />
      </BrowserRouter>
    );

    expect(
      screen.getByPlaceholderText('Search employees, tasks, projects...')
    ).toBeInTheDocument();
  });

  it('triggers search with debounce and renders categorized results', async () => {
    vi.mocked(searchApi.search).mockResolvedValue({
      query: 'Engineering',
      results: {
        employees: [
          {
            id: 'e1',
            title: 'Alice Engineer',
            subtitle: 'alice@company.com • EMPLOYEE',
            type: 'employee',
            url: '/employees?search=Alice',
          },
        ],
        departments: [
          {
            id: 'd1',
            title: 'Engineering Department',
            subtitle: 'Core dev team',
            type: 'department',
            url: '/departments',
          },
        ],
        projects: [],
        tasks: [],
      },
      total: 2,
    });

    render(
      <BrowserRouter>
        <GlobalSearchBar />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Search employees, tasks, projects...');
    fireEvent.change(input, { target: { value: 'Engineering' } });

    await waitFor(() => {
      expect(searchApi.search).toHaveBeenCalledWith('Engineering', 5);
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Engineer')).toBeInTheDocument();
      expect(screen.getByText('Engineering Department')).toBeInTheDocument();
    });
  });
});
