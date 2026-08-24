import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Directory',
  '/departments': 'Departments',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/leaves': 'Leave Management',
  '/attendance': 'Attendance',
  '/profile': 'User Profile',
};

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle = routeTitles[location.pathname] || 'WorkFlow Pro';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} title={currentTitle} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
