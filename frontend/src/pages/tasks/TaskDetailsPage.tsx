import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  User,
  FolderKanban,
  Edit2,
  Check,
  RefreshCcw,
  UserPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TaskModal } from '../../components/tasks/TaskModal';
import { TaskStatusModal } from '../../components/tasks/TaskStatusModal';
import { TaskAssignModal } from '../../components/tasks/TaskAssignModal';
import { tasksApi } from '../../api/tasks';
import { projectsApi } from '../../api/projects';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';

export const TaskDetailsPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Fetch task details
  const {
    data: task,
    isLoading: isLoadingTask,
    isError: isTaskError,
    error: taskError,
    refetch: refetchTask,
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId!),
    enabled: Boolean(taskId),
  });

  // 2. Fetch related project
  const { data: project } = useQuery({
    queryKey: ['project', task?.project_id],
    queryFn: () => projectsApi.get(task!.project_id),
    enabled: Boolean(task?.project_id),
  });

  // 3. Fetch assigned employee
  const { data: assignedEmployee } = useQuery({
    queryKey: ['employee', task?.assigned_to_id],
    queryFn: () => employeesApi.get(task!.assigned_to_id!),
    enabled: Boolean(task?.assigned_to_id),
  });

  const completeMutation = useMutation({
    mutationFn: () => tasksApi.complete(taskId!),
    onSuccess: () => {
      refetchTask();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActionSuccessMsg('Task marked as COMPLETED.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    },
  });

  if (isLoadingTask) {
    return (
      <PageContainer>
        <div className="py-20">
          <LoadingSpinner size="lg" text="Loading task details..." />
        </div>
      </PageContainer>
    );
  }

  if (isTaskError || !task) {
    return (
      <PageContainer>
        <div className="my-8">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tasks</span>
          </Link>
          <ErrorMessage
            title="Task Not Found"
            message={getErrorMessage(taskError || 'This task could not be found or you do not have permission to view it.')}
          />
        </div>
      </PageContainer>
    );
  }

  const isAssignedToMe = task.assigned_to_id === user?.id;
  const canModifyThisTask = userRole === 'admin' || userRole === 'manager' || isAssignedToMe;
  const canManageTask = userRole === 'admin' || userRole === 'manager';

  return (
    <PageContainer>
      {/* Back Link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <Link
          to="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tasks</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {task.status !== 'COMPLETED' && canModifyThisTask && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{completeMutation.isPending ? 'Completing...' : 'Mark Completed'}</span>
            </button>
          )}

          {canModifyThisTask && (
            <button
              onClick={() => setIsStatusOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Update Status</span>
            </button>
          )}

          {canManageTask && (
            <>
              <button
                onClick={() => setIsAssignOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Reassign</span>
              </button>
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Task Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <StatusBadge status={task.status} size="md" />
            <PriorityBadge priority={task.priority} size="md" />
            <StatusBadge status={task.is_active} size="sm" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {task.title}
          </h1>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed whitespace-pre-line">
            {task.description || 'No description provided for this task.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Project</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {project ? (
                <Link
                  to={`/projects/${project.id}`}
                  className="hover:text-brand-600 transition-colors"
                >
                  {project.name}
                </Link>
              ) : (
                'Loading project...'
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>Assigned Employee</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {assignedEmployee?.full_name || (task.assigned_to_id ? 'Loading...' : 'Unassigned')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not specified'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Completed Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'In Progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          refetchTask();
          setActionSuccessMsg('Task updated successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        taskToEdit={task}
      />

      {/* Update Status Modal */}
      <TaskStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        onSuccess={() => {
          refetchTask();
          setActionSuccessMsg('Task status updated successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        task={task}
      />

      {/* Assign Task Modal */}
      <TaskAssignModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={() => {
          refetchTask();
          setActionSuccessMsg('Task assigned successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        task={task}
      />
    </PageContainer>
  );
};
