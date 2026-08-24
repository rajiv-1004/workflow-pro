import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../../components/layout/PageContainer';
import { attendanceApi } from '../../api/attendance';
import { employeesApi } from '../../api/employees';
import { AttendanceStatus } from '../../types/attendance';
import { AttendanceActionCard } from '../../components/attendance/AttendanceActionCard';
import { AttendanceSummaryCards } from '../../components/attendance/AttendanceSummaryCards';
import { AttendanceHistoryTable } from '../../components/attendance/AttendanceHistoryTable';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  // Tabs: 'my' | 'team'
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');

  // Month & Year for summary
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // History filters
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | ''>('');
  const [isLateFilter, setIsLateFilter] = useState<boolean | ''>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // 1. Fetch Today's Attendance record for Current User
  const todayStr = now.toISOString().split('T')[0];
  const { data: myTodayData, isLoading: isLoadingToday } = useQuery({
    queryKey: ['attendance-today', user?.id, todayStr],
    queryFn: () => attendanceApi.getMyAttendance({ start_date: todayStr, end_date: todayStr, page_size: 1 }),
  });

  const todayRecord = myTodayData?.items?.[0] || null;

  // 2. Fetch Monthly Summary
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['attendance-summary', user?.id, selectedMonth, selectedYear],
    queryFn: () => attendanceApi.getMySummary({ month: selectedMonth, year: selectedYear }),
  });

  // 3. Fetch Employees for team filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-directory'],
    queryFn: () => employeesApi.list({ page_size: 100 }),
    enabled: isManagerOrAdmin && activeTab === 'team',
  });

  const employeeMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (employeesData?.items) {
      employeesData.items.forEach((emp) => map.set(emp.id, emp.full_name));
    }
    return map;
  }, [employeesData]);

  // 4. Fetch Attendance History
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'attendance-history',
      activeTab,
      selectedStatus,
      isLateFilter,
      selectedEmployeeId,
      page,
      pageSize,
      user?.id,
    ],
    queryFn: () => {
      const params: Parameters<typeof attendanceApi.list>[0] = {
        page,
        page_size: pageSize,
        sort_by: 'attendance_date',
        sort_order: 'desc',
      };
      if (selectedStatus) params.status = selectedStatus;
      if (isLateFilter !== '') params.is_late = Boolean(isLateFilter);

      if (activeTab === 'team' && isManagerOrAdmin) {
        if (selectedEmployeeId) params.employee_id = selectedEmployeeId;
        return attendanceApi.list(params);
      } else {
        return attendanceApi.getMyAttendance(params);
      }
    },
  });

  return (
    <PageContainer>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track your daily attendance and working hours.
        </p>
      </div>

      {/* Top Action Card */}
      <AttendanceActionCard todayRecord={todayRecord} isLoading={isLoadingToday} />

      {/* Monthly Summary Section */}
      <AttendanceSummaryCards
        summary={summaryData || null}
        isLoading={isLoadingSummary}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={(m) => setSelectedMonth(m)}
        onYearChange={(y) => setSelectedYear(y)}
      />

      {/* Attendance History Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-900">Attendance Log</h2>
            {isManagerOrAdmin && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => {
                    setActiveTab('my');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'my'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  My Attendance
                </button>
                <button
                  onClick={() => {
                    setActiveTab('team');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'team'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Team Attendance
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'team' && isManagerOrAdmin && (
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Employees</option>
                {employeesData?.items?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as AttendanceStatus | '');
                setPage(1);
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">On Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>

            <select
              value={String(isLateFilter)}
              onChange={(e) => {
                setIsLateFilter(e.target.value === '' ? '' : e.target.value === 'true');
                setPage(1);
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Punctuality</option>
              <option value="false">On Time Only</option>
              <option value="true">Late Arrivals Only</option>
            </select>
          </div>
        </div>

        {/* History Table or Error */}
        {isError ? (
          <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Failed to Load Attendance History</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {error instanceof Error ? error.message : 'Unable to connect with the backend service.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <AttendanceHistoryTable
            records={historyData?.items || []}
            isLoading={isLoadingHistory}
            page={historyData?.page || 1}
            pageSize={pageSize}
            total={historyData?.total || 0}
            totalPages={historyData?.pages || 0}
            onPageChange={(p) => setPage(p)}
            showEmployeeColumn={activeTab === 'team' && isManagerOrAdmin}
            getEmployeeName={(id) => (id === user?.id ? `${user.full_name} (You)` : employeeMap.get(id) || 'Employee')}
          />
        )}
      </div>
    </PageContainer>
  );
};
