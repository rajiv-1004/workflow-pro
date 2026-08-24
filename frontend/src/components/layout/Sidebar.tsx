import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  CalendarOff,
  Clock,
  UserCircle,
  LogOut,
  Layers,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: ('admin' | 'manager' | 'employee')[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
      { label: 'Departments', href: '/departments', icon: Building2, roles: ['admin', 'manager'] },
      { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Projects', href: '/projects', icon: FolderKanban },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Self Service',
    items: [
      { label: 'Leave Requests', href: '/leaves', icon: CalendarOff },
      { label: 'Attendance', href: '/attendance', icon: Clock },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', href: '/profile', icon: UserCircle },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role?.name || 'employee';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-none text-base">
                WorkFlow<span className="text-brand-400 font-semibold ml-0.5">Pro</span>
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Enterprise SaaS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navSections.map((section, idx) => {
            const filteredItems = section.items.filter(
              (item) => !item.roles || item.roles.includes(userRole)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {section.title && (
                  <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {section.title}
                  </h3>
                )}
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 group',
                          isActive
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-700/60 border border-brand-500/40 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.full_name || 'User'}
                </p>
                <span className="inline-block px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-brand-500/20 text-brand-300">
                  {userRole}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
