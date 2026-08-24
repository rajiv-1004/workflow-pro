import React from 'react';
import { LucideIcon, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';

interface ComingSoonPageProps {
  title: string;
  description: string;
  moduleName: string;
  weekNumber: number;
  icon: LucideIcon;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
  moduleName,
  weekNumber,
  icon: Icon,
}) => {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-600 mb-6 shadow-sm">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{moduleName} Module • Scheduled for Week {weekNumber}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>

        <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60 max-w-md w-full text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Backend API Status:
          </p>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>FastAPI Endpoints:</span>
            <span className="font-semibold text-emerald-600">✓ Ready & Tested</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Frontend UI View:</span>
            <span className="font-semibold text-brand-600">Coming in Week {weekNumber}</span>
          </div>
        </div>

        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};
