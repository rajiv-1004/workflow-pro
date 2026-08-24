import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ErrorMessage } from '../common/ErrorMessage';
import { Project, ProjectStatus } from '../../types/project';
import { projectsApi } from '../../api/projects';
import { departmentsApi } from '../../api/departments';
import { employeesApi } from '../../api/employees';
import { getErrorMessage } from '../../utils/errors';

const projectSchema = z
  .object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
    description: z.string().max(1000).optional().nullable(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
    department_id: z.string().optional().nullable(),
    manager_id: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.due_date) {
        return new Date(data.due_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'Due date must be on or after the start date',
      path: ['due_date'],
    }
  );

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectToEdit,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active departments
  const { data: deptData } = useQuery({
    queryKey: ['departments-active-list'],
    queryFn: () => departmentsApi.list({ is_active: true, page_size: 100 }),
    enabled: isOpen,
  });

  // Load employees for manager selection
  const { data: empData } = useQuery({
    queryKey: ['employees-active-list'],
    queryFn: () => employeesApi.list({ is_active: true, page_size: 100 }),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'PLANNING',
      department_id: '',
      manager_id: '',
      start_date: '',
      due_date: '',
    },
  });

  useEffect(() => {
    if (projectToEdit) {
      reset({
        name: projectToEdit.name,
        description: projectToEdit.description || '',
        status: projectToEdit.status,
        department_id: projectToEdit.department_id || '',
        manager_id: projectToEdit.manager_id || '',
        start_date: projectToEdit.start_date ? projectToEdit.start_date.slice(0, 10) : '',
        due_date: projectToEdit.due_date ? projectToEdit.due_date.slice(0, 10) : '',
      });
    } else {
      reset({
        name: '',
        description: '',
        status: 'PLANNING',
        department_id: '',
        manager_id: '',
        start_date: '',
        due_date: '',
      });
    }
    setServerError(null);
  }, [projectToEdit, isOpen, reset]);

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload = {
        name: values.name,
        description: values.description || null,
        status: values.status as ProjectStatus,
        department_id: values.department_id || null,
        manager_id: values.manager_id || null,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
      };

      if (projectToEdit) {
        await projectsApi.update(projectToEdit.id, payload);
      } else {
        await projectsApi.create(payload);
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
      title={projectToEdit ? 'Edit Project' : 'Create New Project'}
      description="Coordinate organizational initiatives with clear milestones and owners."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <ErrorMessage message={serverError} onDismiss={() => setServerError(null)} />}

        {/* Project Name */}
        <div>
          <label htmlFor="proj-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="proj-name"
            type="text"
            disabled={isSubmitting}
            placeholder="e.g. Mobile App Redesign"
            {...register('name')}
            className={`block w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
              errors.name ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
            }`}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="proj-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            id="proj-desc"
            rows={3}
            disabled={isSubmitting}
            placeholder="Outline project deliverables and scope..."
            {...register('description')}
            className="block w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {/* Department & Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proj-dept" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Department
            </label>
            <select
              id="proj-dept"
              disabled={isSubmitting}
              {...register('department_id')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">-- No Department --</option>
              {deptData?.items.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="proj-mgr" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Project Manager
            </label>
            <select
              id="proj-mgr"
              disabled={isSubmitting}
              {...register('manager_id')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">-- Unassigned --</option>
              {empData?.items.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="proj-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Status
            </label>
            <select
              id="proj-status"
              disabled={isSubmitting}
              {...register('status')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="proj-start" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Start Date
            </label>
            <input
              id="proj-start"
              type="date"
              disabled={isSubmitting}
              {...register('start_date')}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="proj-due" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Due Date
            </label>
            <input
              id="proj-due"
              type="date"
              disabled={isSubmitting}
              {...register('due_date')}
              className={`block w-full px-3 py-2 bg-slate-50/50 border rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                errors.due_date ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
              }`}
            />
            {errors.due_date && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.due_date.message}</p>
            )}
          </div>
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
              <span>{projectToEdit ? 'Update Project' : 'Create Project'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
