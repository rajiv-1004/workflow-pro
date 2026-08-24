import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from '../components/common/PublicRoute';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { DepartmentsPage } from '../pages/departments/DepartmentsPage';
import { EmployeesPage } from '../pages/employees/EmployeesPage';
import { ProjectsPage } from '../pages/projects/ProjectsPage';
import { ProjectDetailsPage } from '../pages/projects/ProjectDetailsPage';
import { TasksPage } from '../pages/tasks/TasksPage';
import { TaskDetailsPage } from '../pages/tasks/TaskDetailsPage';
import { LeavesPage } from '../pages/leaves/LeavesPage';
import { AttendancePage } from '../pages/attendance/AttendancePage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes (Accessible only when unauthenticated) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes (Require active authentication) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Fully implemented Week 2 Modules */}
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />

          {/* Fully implemented Week 3 Modules */}
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />

          {/* Fully implemented Week 4 Modules */}
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
