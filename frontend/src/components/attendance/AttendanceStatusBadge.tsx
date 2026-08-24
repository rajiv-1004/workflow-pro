import React from 'react';
import { cn } from '../../utils/cn';
import { AttendanceStatus } from '../../types/attendance';
import { formatAttendanceStatus } from '../../utils/formatters';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<AttendanceStatus, { bg: string; text: string; border: string; dot: string }> = {
  PRESENT: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ABSENT: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  HALF_DAY: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  LEAVE: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  HOLIDAY: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
};

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  const normalizedKey = (String(status).toUpperCase() as AttendanceStatus) in statusConfig
    ? (String(status).toUpperCase() as AttendanceStatus)
    : 'PRESENT';

  const config = statusConfig[normalizedKey];
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs whitespace-nowrap',
        config.bg,
        config.text,
        config.border,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      <span>{formatAttendanceStatus(normalizedKey)}</span>
    </span>
  );
};
