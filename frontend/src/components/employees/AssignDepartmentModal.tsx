import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Building2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ErrorMessage } from '../common/ErrorMessage';
import { Employee } from '../../types/employee';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { getErrorMessage } from '../../utils/errors';

interface AssignDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
}

export const AssignDepartmentModal: React.FC<AssignDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    employee?.department_id || ''
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active departments for assignment dropdown
  const { data: deptData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departments-all-active'],
    queryFn: () => departmentsApi.list({ is_active: true, page_size: 100 }),
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      await employeesApi.assignDepartment(employee.id, {
        department_id: selectedDeptId || null,
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
      title="Assign Department"
      description={`Update department assignment for ${employee?.full_name || 'Employee'}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <ErrorMessage message={serverError} onDismiss={() => setServerError(null)} />}

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 border border-brand-200 text-brand-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
            {employee?.full_name?.charAt(0).toUpperCase() || 'E'}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 truncate">{employee?.full_name}</h4>
            <p className="text-xs text-slate-500 truncate">{employee?.email}</p>
          </div>
        </div>

        <div>
          <label htmlFor="dept-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Select Department
          </label>
          {isLoadingDepts ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Loading available departments...</span>
            </div>
          ) : (
            <select
              id="dept-select"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              disabled={isSubmitting}
              className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">-- Unassigned / No Department --</option>
              {deptData?.items.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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
            disabled={isSubmitting || isLoadingDepts}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md shadow-brand-600/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Save Assignment
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
