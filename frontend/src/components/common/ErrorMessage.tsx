import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorMessageProps {
  message?: string | null;
  title?: string;
  variant?: 'inline' | 'banner';
  className?: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  variant = 'banner',
  className,
  onDismiss,
}) => {
  if (!message) return null;

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-rose-600 mt-1', className)}>
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-lg border border-rose-200 bg-rose-50/80 text-rose-900 text-sm shadow-sm animate-in fade-in duration-200',
        className
      )}
    >
      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-semibold text-rose-950 mb-0.5">{title}</h5>}
        <p className="text-rose-800 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-600 transition-colors p-0.5 -mr-1"
          aria-label="Dismiss error"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
