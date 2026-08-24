import React from 'react';
import { cn } from '../../utils/cn';
import { LeaveType } from '../../types/leave';
import { formatLeaveType } from '../../utils/formatters';

interface LeaveTypeBadgeProps {
  type: LeaveType | string;
  className?: string;
}

const typeStyles: Record<LeaveType, { bg: string; text: string; border: string }> = {
  SICK: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  CASUAL: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  ANNUAL: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  UNPAID: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  OTHER: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
};

export const LeaveTypeBadge: React.FC<LeaveTypeBadgeProps> = ({ type, className }) => {
  const normalizedKey = (String(type).toUpperCase() as LeaveType) in typeStyles
    ? (String(type).toUpperCase() as LeaveType)
    : 'OTHER';

  const style = typeStyles[normalizedKey];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {formatLeaveType(type)}
    </span>
  );
};
