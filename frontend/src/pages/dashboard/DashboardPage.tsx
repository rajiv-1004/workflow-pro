import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Building2,
  CalendarOff,
  Clock,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  PieChart,
  AlertCircle,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { analyticsApi } from '../../api/analytics';
import { attendanceApi } from '../../api/attendance';
import { formatMinutesToDuration, formatTime } from '../../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  // 1. Fetch backend analytics
  const { data: analytics, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: analyticsApi.getDashboardAnalytics,
  });

  // 2. Fetch today's attendance state
  const { data: myAttendance } = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: () => attendanceApi.getMyAttendance(),
  });

  if (isLoading) {
    return (
      <PageContainer title="Enterprise Dashboard">
        <div className="py-20 flex justify-center">
          <LoadingSpinner text="Aggregating real-time organization analytics..." />
        </div>
      </PageContainer>
    );
  }

  if (isError || !analytics) {
    return (
      <PageContainer title="Enterprise Dashboard">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <div>
            <h3 className="text-sm font-bold">Failed to load dashboard analytics</h3>
            <p className="text-xs text-rose-600 mt-0.5">
              {(error as Error)?.message || 'An error occurred while connecting to the analytics engine.'}
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const { summary, tasks, projects, departments, attendance, leaves } = analytics;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = myAttendance?.items?.find((r) => r.attendance_date === todayStr);

  return (
    <PageContainer
      title="Enterprise Dashboard"
      description={`Welcome back, ${user?.full_name || 'User'} • Real-time operational intelligence and workload analytics.`}
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Reports & Exports</span>
          </Link>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Tasks</span>
          </Link>
        </div>
      }
    >
      {/* 1. Top Metrics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Tasks / Completion */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isManagerOrAdmin ? 'Open Tasks' : 'My Assigned Tasks'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{summary.open_tasks}</h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {tasks.completion_rate}% Done
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.completed_tasks} completed of {tasks.total} total
          </p>
        </div>

        {/* Metric 2: Active Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{summary.active_projects}</h3>
            <span className="text-xs font-semibold text-slate-500">
              {projects.total} Total
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {projects.planning} planning • {projects.completed} completed
          </p>
        </div>

        {/* Metric 3: Organization / Department Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isManagerOrAdmin ? 'Active Employees' : 'Organization Units'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {isManagerOrAdmin ? <Users className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {isManagerOrAdmin ? summary.active_employees : summary.total_departments}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {isManagerOrAdmin ? `${summary.total_departments} Depts` : `${userRole.toUpperCase()}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isManagerOrAdmin ? `${summary.total_employees} registered staff` : 'Active tenant subscription'}
          </p>
        </div>

        {/* Metric 4: Pending Leaves / Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isManagerOrAdmin ? 'Pending Leaves' : 'Attendance Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              {isManagerOrAdmin ? <CalendarOff className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              {isManagerOrAdmin ? summary.pending_leaves : `${attendance.attendance_rate}%`}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {isManagerOrAdmin ? `${leaves.approved_count} approved` : `${attendance.present_count} present`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isManagerOrAdmin ? 'Action required for approval' : `${attendance.late_count} late arrivals recorded`}
          </p>
        </div>
      </div>

      {/* 2. Middle Row: Task Analytics & Project Distribution & Timecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>In Progress</span>
                <span className="font-bold text-slate-900">{tasks.in_progress}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${tasks.total ? (tasks.in_progress / tasks.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>To Do</span>
                <span className="font-bold text-slate-900">{tasks.todo}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${tasks.total ? (tasks.todo / tasks.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>In Review</span>
                <span className="font-bold text-slate-900">{tasks.in_review}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${tasks.total ? (tasks.in_review / tasks.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Completed</span>
                <span className="font-bold text-slate-900">{tasks.completed}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${tasks.total ? (tasks.completed / tasks.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Completion Rate</span>
            <span className="font-bold text-emerald-600">{tasks.completion_rate}%</span>
          </div>
        </div>

        {/* Project Pipeline Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Project Pipeline</h3>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View Projects
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700">Active</span>
              <p className="text-xl font-bold text-emerald-900 mt-1">{projects.active}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-700">Planning</span>
              <p className="text-xl font-bold text-blue-900 mt-1">{projects.planning}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[11px] font-semibold text-amber-700">On Hold</span>
              <p className="text-xl font-bold text-amber-900 mt-1">{projects.on_hold}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-[11px] font-semibold text-purple-700">Completed</span>
              <p className="text-xl font-bold text-purple-900 mt-1">{projects.completed}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Projects Monitored</span>
            <span className="font-bold text-slate-900">{projects.total}</span>
          </div>
        </div>

        {/* Today's Live Timecard Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Today's Timecard</h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {todayRecord ? (todayRecord.check_out ? 'Logged' : 'Working') : 'Not Checked In'}
              </span>
            </div>

            {todayRecord ? (
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Check In:</span>
                  <span className="font-bold text-slate-900">{formatTime(todayRecord.check_in)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Check Out:</span>
                  <span className="font-bold text-slate-900">{formatTime(todayRecord.check_out)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Logged Duration:</span>
                  <span className="font-bold text-emerald-600">
                    {formatMinutesToDuration(todayRecord.working_minutes)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 text-center py-6">
                <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">No shift logged yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check in to record today's attendance.
                </p>
              </div>
            )}
          </div>

          <Link
            to="/attendance"
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Go to Attendance Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. Bottom Row: Department Distribution (for Admin/Manager) or Leave Type Breakdown */}
      {isManagerOrAdmin && departments.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Department Workforce Distribution</h3>
            </div>
            <Link to="/departments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Manage Units
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between hover:bg-indigo-50/40 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{dept.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {dept.employee_count} assigned {dept.employee_count === 1 ? 'member' : 'members'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-2xs">
                  {dept.employee_count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
