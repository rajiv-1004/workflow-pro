import React from 'react';
import { cn } from '../../utils/cn';
import { TaskPriority } from '../../types/task';
import { ArrowDown, ArrowRight, ArrowUp, AlertOctagon } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TaskPriority | string;
  size?: 'sm' | 'md';
  className?: string;
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  LOW: {
    label: 'Low',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: ArrowDown,
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: ArrowRight,
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: ArrowUp,
  },
  URGENT: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertOctagon,
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'sm',
  className,
}) => {
  const normPriority = (priority ? priority.toUpperCase() : 'MEDIUM') as TaskPriority;
  const config = priorityConfig[normPriority] || priorityConfig.MEDIUM;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full border shadow-2xs whitespace-nowrap',
        config.bg,
        config.text,
        config.border,
        sizeClasses,
        className
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
