import { LeaveType, LeaveStatus } from '../types/leave';
import { AttendanceStatus } from '../types/attendance';

export const formatMinutesToDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.floor(minutes % 60);

  if (hours === 0) {
    return `${remainingMins}m`;
  }
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
};

export const formatLeaveType = (type: LeaveType | string): string => {
  switch (type) {
    case 'SICK':
      return 'Sick Leave';
    case 'CASUAL':
      return 'Casual Leave';
    case 'ANNUAL':
      return 'Annual Leave';
    case 'UNPAID':
      return 'Unpaid Leave';
    case 'OTHER':
      return 'Other Leave';
    default:
      return type;
  }
};

export const formatLeaveStatus = (status: LeaveStatus | string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pending Review';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const formatAttendanceStatus = (status: AttendanceStatus | string): string => {
  switch (status) {
    case 'PRESENT':
      return 'Present';
    case 'ABSENT':
      return 'Absent';
    case 'HALF_DAY':
      return 'Half Day';
    case 'LEAVE':
      return 'On Leave';
    case 'HOLIDAY':
      return 'Holiday';
    default:
      return status;
  }
};

export const formatDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

export const formatTime = (timeStr?: string | Date | null): string => {
  if (!timeStr) return '—';
  try {
    const d = typeof timeStr === 'string' ? new Date(timeStr) : timeStr;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(timeStr);
  }
};

export const formatDateTime = (dateTimeStr?: string | Date | null): string => {
  if (!dateTimeStr) return '—';
  try {
    const d = typeof dateTimeStr === 'string' ? new Date(dateTimeStr) : dateTimeStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateTimeStr);
  }
};
