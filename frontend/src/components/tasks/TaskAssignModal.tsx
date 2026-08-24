import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ErrorMessage } from '../common/ErrorMessage';
import { Task } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { employeesApi } from '../../api/employees';
import { getErrorMessage } from '../../utils/errors';

interface TaskAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
}

export const TaskAssignModal: React.FC<TaskAssignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    task?.assigned_to_id || ''
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-assign-list'],
    queryFn: () => employeesApi.list({ is_active: true, page_size: 100 }),
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      await tasksApi.assign(task.id, {
        assigned_to_id: selectedEmployeeId || null,
      });

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
      title="Assign Task"
      description={`Assign responsibility for "${task?.title}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <ErrorMessage message={serverError} onDismiss={() => setServerError(null)} />}

        <div>
          <label htmlFor="tassign-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Assign To Employee
          </label>
          {isLoadingEmployees ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Loading employees...</span>
            </div>
          ) : (
            <select
              id="tassign-select"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={isSubmitting}
              className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">-- Unassigned --</option>
              {employeesData?.items.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.email})
                </option>
              ))}
            </select>
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
            disabled={isSubmitting || isLoadingEmployees}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md shadow-brand-600/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Save Assignment
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
