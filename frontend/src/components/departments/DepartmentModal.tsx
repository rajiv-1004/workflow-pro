import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ErrorMessage } from '../common/ErrorMessage';
import { Department } from '../../types/department';
import { departmentsApi } from '../../api/departments';
import { getErrorMessage } from '../../utils/errors';

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  description: z.string().max(255, 'Description is too long').optional().nullable(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departmentToEdit?: Department | null;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departmentToEdit,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (departmentToEdit) {
      reset({
        name: departmentToEdit.name,
        description: departmentToEdit.description || '',
      });
    } else {
      reset({
        name: '',
        description: '',
      });
    }
    setServerError(null);
  }, [departmentToEdit, isOpen, reset]);

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      if (departmentToEdit) {
        await departmentsApi.update(departmentToEdit.id, {
          name: values.name,
          description: values.description || null,
        });
      } else {
        await departmentsApi.create({
          name: values.name,
          description: values.description || null,
        });
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
      title={departmentToEdit ? 'Edit Department' : 'Create Department'}
      description="Define an organizational unit or functional division within your company."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <ErrorMessage message={serverError} onDismiss={() => setServerError(null)} />}

        <div>
          <label htmlFor="dept-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Department Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="dept-name"
            type="text"
            disabled={isSubmitting}
            placeholder="e.g. Engineering, Product, Marketing"
            {...register('name')}
            className={`block w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
              errors.name ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
            }`}
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="dept-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Description <span className="text-slate-400 lowercase font-normal">(optional)</span>
          </label>
          <textarea
            id="dept-desc"
            rows={3}
            disabled={isSubmitting}
            placeholder="Briefly describe the responsibilities and scope of this department..."
            {...register('description')}
            className={`block w-full px-3.5 py-2 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
              errors.description ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
            }`}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.description.message}</p>
          )}
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
              <span>{departmentToEdit ? 'Update Department' : 'Create Department'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
