import React from 'react';
import { cn } from '../../utils/cn';

interface PageContainerProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn('p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            {title && <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>}
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
