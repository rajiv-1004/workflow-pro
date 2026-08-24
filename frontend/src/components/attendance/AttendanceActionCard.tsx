import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { attendanceApi } from '../../api/attendance';
import { AttendanceRecord } from '../../types/attendance';
import { formatTime, formatMinutesToDuration } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errors';

interface AttendanceActionCardProps {
  todayRecord: AttendanceRecord | null;
  isLoading?: boolean;
}

export const AttendanceActionCard: React.FC<AttendanceActionCardProps> = ({
  todayRecord,
  isLoading,
}) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isCheckedIn = !!todayRecord?.check_in;
  const isCheckedOut = !!todayRecord?.check_out;

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isCheckedIn && !isCheckedOut && todayRecord?.check_in) {
      const checkInTime = new Date(todayRecord.check_in).getTime();

      const updateElapsed = () => {
        const now = new Date().getTime();
        const diffInSeconds = Math.max(0, Math.floor((now - checkInTime) / 1000));
        setElapsedSeconds(diffInSeconds);
      };

      updateElapsed();
      timer = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCheckedIn, isCheckedOut, todayRecord?.check_in]);

  const formatElapsed = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-attendance'] });
      setSuccessMessage('Checked in successfully! Have a productive workday.');
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj.response?.status === 409) {
        setErrorMessage('You have already checked in today.');
      } else {
        setErrorMessage(extractErrorMessage(err));
      }
      setSuccessMessage(null);
    },
  });

  // Check Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-attendance'] });
      setSuccessMessage('Checked out successfully! Working hours recorded.');
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      setErrorMessage(extractErrorMessage(err));
      setSuccessMessage(null);
    },
  });

  const isPending = checkInMutation.isPending || checkOutMutation.isPending;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Attendance</h2>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Current State Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isLoading ? (
            <div className="h-7 w-28 bg-slate-100 rounded-full animate-pulse" />
          ) : !isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Not Checked In
            </span>
          ) : !isCheckedOut ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Working Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Day Completed
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats and Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* Check-In Info Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Check-In Time</span>
          <div className="mt-2">
            <p className="text-lg font-extrabold text-slate-900">
              {todayRecord?.check_in ? formatTime(todayRecord.check_in) : '—'}
            </p>
            {todayRecord?.is_late && (
              <span className="inline-block mt-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Late arrival ({todayRecord.late_minutes}m)
              </span>
            )}
          </div>
        </div>

        {/* Check-Out Info Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Check-Out Time</span>
          <div className="mt-2">
            <p className="text-lg font-extrabold text-slate-900">
              {todayRecord?.check_out ? formatTime(todayRecord.check_out) : '—'}
            </p>
            {isCheckedOut && (
              <span className="inline-block mt-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                Recorded {formatMinutesToDuration(todayRecord.working_minutes)}
              </span>
            )}
          </div>
        </div>

        {/* Timer / Action Button Box */}
        <div className="p-4 rounded-xl border border-slate-200 bg-brand-50/30 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-brand-900">
              {isCheckedIn && !isCheckedOut ? 'Live Working Timer' : 'Today Working Duration'}
            </span>
            <p className="text-lg font-extrabold text-brand-950 mt-1 font-mono tracking-tight">
              {isCheckedIn && !isCheckedOut
                ? formatElapsed(elapsedSeconds)
                : todayRecord?.working_minutes
                ? formatMinutesToDuration(todayRecord.working_minutes)
                : '00:00:00'}
            </p>
          </div>

          <div className="mt-3">
            {!isCheckedIn ? (
              <button
                type="button"
                onClick={() => checkInMutation.mutate()}
                disabled={isPending}
                className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{checkInMutation.isPending ? 'Checking in...' : 'Check In Now'}</span>
              </button>
            ) : !isCheckedOut ? (
              <button
                type="button"
                onClick={() => checkOutMutation.mutate()}
                disabled={isPending}
                className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{checkOutMutation.isPending ? 'Checking out...' : 'Check Out Now'}</span>
              </button>
            ) : (
              <div className="text-center py-1.5 px-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold border border-slate-200">
                Attendance Recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
