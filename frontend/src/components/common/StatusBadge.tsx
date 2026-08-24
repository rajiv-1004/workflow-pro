import React from 'react';
import { cn } from '../../utils/cn';
import { ProjectStatus } from '../../types/project';
import { TaskStatus } from '../../types/task';

interface StatusBadgeProps {
  status: ProjectStatus | TaskStatus | 'ACTIVE' | 'INACTIVE' | boolean | string;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  // Project & Task Statuses
  PLANNING: {
    label: 'Planning',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  TODO: {
    label: 'To Do',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  IN_REVIEW: {
    label: 'In Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  INACTIVE: {
    label: 'Inactive',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  className,
}) => {
  let normalizedKey = String(status).toUpperCase();
  if (typeof status === 'boolean') {
    normalizedKey = status ? 'ACTIVE' : 'INACTIVE';
  }

  const config = statusConfig[normalizedKey] || {
    label: String(status),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

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
