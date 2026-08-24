import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ErrorMessage } from '../common/ErrorMessage';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { projectsApi } from '../../api/projects';
import { employeesApi } from '../../api/employees';
import { getErrorMessage } from '../../utils/errors';

const taskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters').max(150),
  description: z.string().max(2000).optional().nullable(),
  project_id: z.string().min(1, 'Please select a project'),
  assigned_to_id: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  due_date: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: Task | null;
  defaultProjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  defaultProjectId,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch active projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects-active-options'],
    queryFn: () => projectsApi.list({ is_active: true, page_size: 100 }),
    enabled: isOpen,
  });

  // 2. Fetch active employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees-active-options'],
    queryFn: () => employeesApi.list({ is_active: true, page_size: 100 }),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      project_id: defaultProjectId || '',
      assigned_to_id: '',
      priority: 'MEDIUM',
      status: 'TODO',
      due_date: '',
    },
  });

  useEffect(() => {
    if (taskToEdit) {
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        project_id: taskToEdit.project_id,
        assigned_to_id: taskToEdit.assigned_to_id || '',
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        due_date: taskToEdit.due_date ? taskToEdit.due_date.slice(0, 10) : '',
      });
    } else {
      reset({
        title: '',
        description: '',
        project_id: defaultProjectId || '',
        assigned_to_id: '',
        priority: 'MEDIUM',
        status: 'TODO',
        due_date: '',
      });
    }
    setServerError(null);
  }, [taskToEdit, defaultProjectId, isOpen, reset]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        title: values.title,
        description: values.description || null,
        project_id: values.project_id,
        assigned_to_id: values.assigned_to_id || null,
        priority: values.priority as TaskPriority,
        status: (values.status as TaskStatus) || 'TODO',
        due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
      };

      if (taskToEdit) {
        await tasksApi.update(taskToEdit.id, payload);
      } else {
        await tasksApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      description="Define an actionable work item with clear ownership and deadline."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <ErrorMessage message={serverError} onDismiss={() => setServerError(null)} />}

        {/* Title */}
        <div>
          <label htmlFor="task-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            disabled={isSubmitting}
            placeholder="e.g. Implement authentication middleware"
            {...register('title')}
            className={`block w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
              errors.title ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
            }`}
          />
          {errors.title && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.title.message}</p>}
        </div>

        {/* Project & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-proj" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              id="task-proj"
              disabled={isSubmitting}
              {...register('project_id')}
              className={`block w-full px-3 py-2 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer ${
                errors.project_id ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
              }`}
            >
              <option value="">-- Select Project --</option>
              {projectsData?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.project_id && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.project_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="task-assign" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Assignee
            </label>
            <select
              id="task-assign"
              disabled={isSubmitting}
              {...register('assigned_to_id')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">-- Unassigned --</option>
              {employeesData?.items.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority, Status & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="task-priority" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Priority
            </label>
            <select
              id="task-priority"
              disabled={isSubmitting}
              {...register('priority')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Status
            </label>
            <select
              id="task-status"
              disabled={isSubmitting}
              {...register('status')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-due" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Due Date
            </label>
            <input
              id="task-due"
              type="date"
              disabled={isSubmitting}
              {...register('due_date')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="task-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            id="task-desc"
            rows={3}
            disabled={isSubmitting}
            placeholder="Add detailed task specifications or acceptance criteria..."
            {...register('description')}
            className="block w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md shadow-brand-600/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{taskToEdit ? 'Update Task' : 'Create Task'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
