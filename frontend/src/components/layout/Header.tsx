import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlobalSearchBar } from '../search/GlobalSearchBar';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface HeaderProps {
  onOpenSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, title }) => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight hidden md:block">{title}</h2>}
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 flex justify-center max-w-lg">
        <GlobalSearchBar />
      </div>

      {/* Right side: Notifications & User profile pill */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 font-semibold text-xs flex items-center justify-center">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.full_name || 'Authenticated User'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium capitalize">
              {userRole} Account
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

