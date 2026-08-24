import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  CheckSquare,
  Edit2,
  RefreshCcw,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ProjectModal } from '../../components/projects/ProjectModal';
import { ProjectStatusModal } from '../../components/projects/ProjectStatusModal';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import { departmentsApi } from '../../api/departments';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';

export const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const canManage = userRole === 'admin' || userRole === 'manager';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // 1. Fetch project details
  const {
    data: project,
    isLoading: isLoadingProject,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: Boolean(projectId),
  });

  // 2. Fetch department details if present
  const { data: department } = useQuery({
    queryKey: ['department', project?.department_id],
    queryFn: () => departmentsApi.get(project!.department_id!),
    enabled: Boolean(project?.department_id),
  });

  // 3. Fetch manager details if present
  const { data: manager } = useQuery({
    queryKey: ['employee', project?.manager_id],
    queryFn: () => employeesApi.get(project!.manager_id!),
    enabled: Boolean(project?.manager_id),
  });

  // 4. Fetch related tasks for this project
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
  } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => tasksApi.list({ project_id: projectId, page_size: 50 }),
    enabled: Boolean(projectId),
  });

  if (isLoadingProject) {
    return (
      <PageContainer>
        <div className="py-20">
          <LoadingSpinner size="lg" text="Loading project details..." />
        </div>
      </PageContainer>
    );
  }

  if (isProjectError || !project) {
    return (
      <PageContainer>
        <div className="my-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Link>
          <ErrorMessage
            title="Project Not Found"
            message={getErrorMessage(projectError || 'This project could not be found or you do not have permission to view it.')}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back Link */}
      <div className="flex items-center justify-between pb-2">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStatusOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Update Status</span>
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Project Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={project.status} size="md" />
              <StatusBadge status={project.is_active} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-slate-600 text-sm mt-2 max-w-3xl leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Department</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {department?.name || (project.department_id ? 'Loading...' : 'Unassigned')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Project Manager</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {manager?.full_name || (project.manager_id ? 'Loading...' : 'Unassigned')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Start Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString()
                : 'Not specified'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {project.due_date
                ? new Date(project.due_date).toLocaleDateString()
                : 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Related Tasks Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-600" />
              <span>Project Tasks</span>
            </h2>
            <p className="text-xs text-slate-500">
              Assigned action items and completion tracking for this project.
            </p>
          </div>

          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>View in Tasks Workspace</span>
          </Link>
        </div>

        {isLoadingTasks ? (
          <div className="py-12 bg-white rounded-2xl border border-slate-200/80">
            <LoadingSpinner size="md" text="Loading related tasks..." />
          </div>
        ) : !tasksData || tasksData.items.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks for this project yet"
            description="Tasks assigned to this project will appear here."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 sm:px-6">Task Title</th>
                    <th className="py-3 px-4 sm:px-6">Status</th>
                    <th className="py-3 px-4 sm:px-6">Priority</th>
                    <th className="py-3 px-4 sm:px-6">Due Date</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {tasksData.items.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="hover:text-brand-600 transition-colors"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          View Task
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          refetchProject();
        }}
        projectToEdit={project}
      />

      {/* Update Project Status Modal */}
      <ProjectStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        onSuccess={() => {
          refetchProject();
        }}
        project={project}
      />
    </PageContainer>
  );
};
