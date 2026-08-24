import React from 'react';
import { cn } from '../../utils/cn';
import { LeaveStatus } from '../../types/leave';

interface LeaveStatusBadgeProps {
  status: LeaveStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<LeaveStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  PENDING: {
    label: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  const normalizedKey = (String(status).toUpperCase() as LeaveStatus) in statusConfig
    ? (String(status).toUpperCase() as LeaveStatus)
    : 'PENDING';

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
      <span>{config.label}</span>
    </span>
  );
};
