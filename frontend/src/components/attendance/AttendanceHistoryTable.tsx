import React from 'react';
import { Clock, Calendar, User } from 'lucide-react';
import { AttendanceRecord } from '../../types/attendance';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { LateBadge } from './LateBadge';
import { formatDate, formatTime, formatMinutesToDuration } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showEmployeeColumn?: boolean;
  getEmployeeName?: (empId: string) => string;
}

export const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({
  records,
  isLoading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  showEmployeeColumn = false,
  getEmployeeName,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center shadow-2xs">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">No attendance records found</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Records will appear here as daily check-ins and check-outs are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              {showEmployeeColumn && <th className="py-3 px-4">Employee</th>}
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Check-Out</th>
              <th className="py-3 px-4">Working Hours</th>
              <th className="py-3 px-4">Punctuality</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                {/* Date */}
                <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(rec.attendance_date)}</span>
                  </div>
                </td>

                {/* Employee Name (if enabled) */}
                {showEmployeeColumn && (
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-500" />
                      <span>{getEmployeeName ? getEmployeeName(rec.employee_id) : 'Employee'}</span>
                    </div>
                  </td>
                )}

                {/* Check In */}
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-mono">
                  {rec.check_in ? formatTime(rec.check_in) : '—'}
                </td>

                {/* Check Out */}
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-mono">
                  {rec.check_out ? formatTime(rec.check_out) : '—'}
                </td>

                {/* Working Duration */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="font-bold text-slate-800">
                    {rec.working_minutes > 0 ? formatMinutesToDuration(rec.working_minutes) : '—'}
                  </span>
                </td>

                {/* Late status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <LateBadge isLate={rec.is_late} lateMinutes={rec.late_minutes} />
                </td>

                {/* Attendance Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <AttendanceStatusBadge status={rec.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex justify-center">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            pages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
