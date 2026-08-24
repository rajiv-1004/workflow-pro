import React from 'react';
import { cn } from '../../utils/cn';

interface LateBadgeProps {
  isLate: boolean;
  lateMinutes?: number;
  className?: string;
}

export const LateBadge: React.FC<LateBadgeProps> = ({ isLate, lateMinutes = 0, className }) => {
  if (!isLate) {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200',
          className
        )}
      >
        On Time
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs',
        className
      )}
    >
      Late {lateMinutes > 0 ? `(${lateMinutes}m)` : ''}
    </span>
  );
};
