import React from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { AttendanceSummary } from '../../types/attendance';
import { formatMinutesToDuration } from '../../utils/formatters';

interface AttendanceSummaryCardsProps {
  summary: AttendanceSummary | null;
  isLoading?: boolean;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({
  summary,
  isLoading,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      {/* Header & Month/Year Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-900">Monthly Attendance Summary</h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Days */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Days
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isLoading ? '—' : summary?.total_days ?? 0}
          </p>
          <span className="text-[10px] text-slate-400">Recorded this month</span>
        </div>

        {/* Present Days */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Present Days
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 tracking-tight">
            {isLoading ? '—' : summary?.present_days ?? 0}
          </p>
          <span className="text-[10px] text-slate-400">On-site / remote</span>
        </div>

        {/* Late Days */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Late Days
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-700 tracking-tight">
            {isLoading ? '—' : summary?.late_days ?? 0}
          </p>
          <span className="text-[10px] text-slate-400">After grace period</span>
        </div>

        {/* Total Working Time */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              Total Hours
            </span>
            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-brand-700 tracking-tight">
            {isLoading
              ? '—'
              : summary?.total_working_minutes
              ? formatMinutesToDuration(summary.total_working_minutes)
              : '0h'}
          </p>
          <span className="text-[10px] text-slate-400">Total logged time</span>
        </div>

        {/* Average Hours */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">
              Avg / Day
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-purple-700 tracking-tight">
            {isLoading
              ? '—'
              : summary?.average_working_minutes
              ? formatMinutesToDuration(Math.round(summary.average_working_minutes))
              : '0h'}
          </p>
          <span className="text-[10px] text-slate-400">Daily average</span>
        </div>
      </div>
    </div>
  );
};
