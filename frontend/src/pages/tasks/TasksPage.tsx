import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  CheckSquare,
  Trash2,
  CheckCircle2,
  Calendar,
  ExternalLink,
  RefreshCcw,
  UserPlus,
  Check,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterSelect } from '../../components/common/FilterSelect';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TaskModal } from '../../components/tasks/TaskModal';
import { TaskStatusModal } from '../../components/tasks/TaskStatusModal';
import { TaskAssignModal } from '../../components/tasks/TaskAssignModal';
import { tasksApi } from '../../api/tasks';
import { projectsApi } from '../../api/projects';
import { employeesApi } from '../../api/employees';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const canCreateTask = userRole === 'admin' || userRole === 'manager';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToStatusUpdate, setTaskToStatusUpdate] = useState<Task | null>(null);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects-filter-options'],
    queryFn: () => projectsApi.list({ page_size: 100 }),
  });

  // 2. Fetch employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-filter-options'],
    queryFn: () => employeesApi.list({ page_size: 100 }),
  });

  // 3. Fetch tasks
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'tasks',
      {
        search,
        projectFilter,
        assignedFilter,
        statusFilter,
        priorityFilter,
        activeFilter,
        page,
        pageSize,
      },
    ],
    queryFn: () =>
      tasksApi.list({
        search: search || undefined,
        project_id: projectFilter || undefined,
        assigned_to_id: assignedFilter || undefined,
        status: statusFilter ? (statusFilter as TaskStatus) : undefined,
        priority: priorityFilter ? (priorityFilter as TaskPriority) : undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        page,
        page_size: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => tasksApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskToDelete(null);
      setActionSuccessMsg('Task deactivated successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActionSuccessMsg('Task marked as COMPLETED.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    },
  });

  const projectOptions =
    projectsData?.items.map((p) => ({
      value: p.id,
      label: p.name,
    })) || [];

  const employeeOptions =
    employeesData?.items.map((e) => ({
      value: e.id,
      label: e.full_name,
    })) || [];

  return (
    <PageContainer
      title="Tasks"
      description="Manage assignments, priorities, and workflow task completion."
      actions={
        canCreateTask && (
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )
      }
    >
      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search tasks..."
            className="sm:w-80"
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <FilterSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              placeholder="All Statuses"
              options={[
                { value: 'TODO', label: 'To Do' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'IN_REVIEW', label: 'In Review' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              className="w-36"
            />

            <FilterSelect
              value={priorityFilter}
              onChange={(val) => {
                setPriorityFilter(val);
                setPage(1);
              }}
              placeholder="All Priorities"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              className="w-36"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <FilterSelect
            value={projectFilter}
            onChange={(val) => {
              setProjectFilter(val);
              setPage(1);
            }}
            placeholder="All Projects"
            options={projectOptions}
            className="w-48"
          />

          <FilterSelect
            value={assignedFilter}
            onChange={(val) => {
              setAssignedFilter(val);
              setPage(1);
            }}
            placeholder="All Assignees"
            options={employeeOptions}
            className="w-48"
          />

          <FilterSelect
            value={activeFilter}
            onChange={(val) => {
              setActiveFilter(val);
              setPage(1);
            }}
            placeholder="All Records"
            options={[
              { value: 'true', label: 'Active Only' },
              { value: 'false', label: 'Inactive Only' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text="Loading tasks..." />
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Failed to Load Tasks"
          message={getErrorMessage(error)}
          className="my-6"
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            search || projectFilter || assignedFilter || statusFilter || priorityFilter
              ? 'No tasks matched your search filters.'
              : 'Create a new task to organize deliverables and assignments.'
          }
          action={
            canCreateTask && !search && !statusFilter && !projectFilter
              ? {
                  label: 'Create Task',
                  onClick: () => {
                    setTaskToEdit(null);
                    setIsCreateModalOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 sm:px-6">Task</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                  <th className="py-3 px-4 sm:px-6">Priority</th>
                  <th className="py-3 px-4 sm:px-6">Due Date</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.items.map((task) => {
                  const isAssignedToMe = task.assigned_to_id === user?.id;
                  const canModifyThisTask =
                    userRole === 'admin' || userRole === 'manager' || isAssignedToMe;

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900">
                        <Link
                          to={`/tasks/${task.id}`}
                          className="hover:text-brand-600 transition-colors block"
                        >
                          <p className="font-semibold text-slate-900 line-clamp-1">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-500 whitespace-nowrap">
                        {task.due_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        ) : (
                          'No due date'
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Complete Action */}
                          {task.status !== 'COMPLETED' && canModifyThisTask && (
                            <button
                              onClick={() => completeMutation.mutate(task.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              title="Mark Task as Completed"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}

                          {/* Quick Status Update */}
                          {canModifyThisTask && (
                            <button
                              onClick={() => setTaskToStatusUpdate(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                              title="Change Status"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Reassign (Admin / Manager) */}
                          {(userRole === 'admin' || userRole === 'manager') && (
                            <button
                              onClick={() => setTaskToAssign(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                              title="Assign Task"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Details Link */}
                          <Link
                            to={`/tasks/${task.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Deactivate (Admin / Manager) */}
                          {(userRole === 'admin' || userRole === 'manager') && task.is_active && (
                            <button
                              onClick={() => setTaskToDelete(task)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Deactivate Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/40">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              pages={data.pages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg(
            taskToEdit ? 'Task updated successfully.' : 'Task created successfully.'
          );
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        taskToEdit={taskToEdit}
      />

      {/* Update Status Modal */}
      <TaskStatusModal
        isOpen={Boolean(taskToStatusUpdate)}
        onClose={() => setTaskToStatusUpdate(null)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg('Task status updated successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        task={taskToStatusUpdate}
      />

      {/* Assign Task Modal */}
      <TaskAssignModal
        isOpen={Boolean(taskToAssign)}
        onClose={() => setTaskToAssign(null)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg('Task assigned successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        task={taskToAssign}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            deactivateMutation.mutate(taskToDelete.id);
          }
        }}
        title="Deactivate Task"
        message={`Are you sure you want to deactivate task "${taskToDelete?.title}"?`}
        confirmText="Deactivate"
        isLoading={deactivateMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
};
