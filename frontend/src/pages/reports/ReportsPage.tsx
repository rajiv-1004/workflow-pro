import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../../components/layout/PageContainer';
import { reportsApi } from '../../api/reports';
import { departmentsApi } from '../../api/departments';
import { projectsApi } from '../../api/projects';
import { Department } from '../../types/department';
import { getErrorMessage } from '../../utils/errors';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  const [activeTab, setActiveTab] = useState<'employees' | 'projects' | 'tasks' | 'attendance'>(
    isManagerOrAdmin ? 'employees' : 'tasks'
  );

  // Filters state
  const [departmentId, setDepartmentId] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<string>('');
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Department options
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list(),
  });

  // Project options
  const { data: projData } = useQuery({
    queryKey: ['projects', 'list-simple'],
    queryFn: () => projectsApi.list({ page: 1, page_size: 100 }),
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      if (activeTab === 'employees') {
        await reportsApi.exportEmployees({
          department_id: departmentId || undefined,
        });
        setExportSuccess('Employees Excel report generated and downloaded.');
      } else if (activeTab === 'projects') {
        await reportsApi.exportProjects({
          status: projectStatus || undefined,
        });
        setExportSuccess('Projects Excel report generated and downloaded.');
      } else if (activeTab === 'tasks') {
        await reportsApi.exportTasks({
          project_id: taskProjectId || undefined,
          status: taskStatus || undefined,
          priority: taskPriority || undefined,
        });
        setExportSuccess('Tasks Excel report generated and downloaded.');
      } else if (activeTab === 'attendance') {
        await reportsApi.exportAttendance({
          status: attendanceStatus || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setExportSuccess('Attendance Excel report generated and downloaded.');
      }
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      setExportError(getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageContainer
      title="Enterprise Reports & Excel Export"
      description="Generate formatted spreadsheet reports (.xlsx) with role-aware multi-tenant data."
    >
      {/* Alert Notices */}
      {exportSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {exportError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation: Report Type Selection */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Available Reports
          </h3>

          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('employees')}
              className={`w-full px-3.5 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="truncate">Employee Directory</p>
                <p
                  className={`text-[10px] truncate ${
                    activeTab === 'employees' ? 'text-brand-200' : 'text-slate-400'
                  }`}
                >
                  Staff list & roles
                </p>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full px-3.5 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FolderKanban className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="truncate">Project Pipeline</p>
              <p
                className={`text-[10px] truncate ${
                  activeTab === 'projects' ? 'text-brand-200' : 'text-slate-400'
                }`}
              >
                Statuses & timelines
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full px-3.5 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="truncate">Tasks & Assignments</p>
              <p
                className={`text-[10px] truncate ${
                  activeTab === 'tasks' ? 'text-brand-200' : 'text-slate-400'
                }`}
              >
                Completion & priorities
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full px-3.5 py-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="truncate">Attendance & Punctuality</p>
              <p
                className={`text-[10px] truncate ${
                  activeTab === 'attendance' ? 'text-brand-200' : 'text-slate-400'
                }`}
              >
                Work hours & shifts
              </p>
            </div>
          </button>
        </div>

        {/* Right Section: Configuration & Filter Card */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 capitalize">
                  {activeTab} Export Configuration
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure dataset parameters and export a styled Microsoft Excel (.xlsx) workbook.
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700">
              .XLSX Format
            </span>
          </div>

          {/* Dynamic Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Report Filters</span>
            </div>

            {/* 1. Employee Report Filters */}
            {activeTab === 'employees' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  >
                    <option value="">All Departments</option>
                    {deptData?.items?.map((d: Department) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 2. Project Report Filters */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Project Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  >
                    <option value="">All Statuses</option>
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            {/* 3. Task Report Filters */}
            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Project
                  </label>
                  <select
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  >
                    <option value="">All Projects</option>
                    {projData?.items?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Task Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  >
                    <option value="">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. Attendance Report Filters */}
            {activeTab === 'attendance' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Status
                  </label>
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  >
                    <option value="">All Records</option>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="LEAVE">Leave</option>
                    <option value="HOLIDAY">Holiday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Details info box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Multi-Tenant Scoping & Data Privacy
              </p>
              <p className="leading-relaxed">
                Exported spreadsheets contain data strictly isolated to your company ID.
                {!isManagerOrAdmin && ' As an employee, reports are limited to your assigned tasks and personal attendance.'}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting Spreadsheet...' : `Download ${activeTab} (.xlsx)`}</span>
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
