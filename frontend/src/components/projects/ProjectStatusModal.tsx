import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ErrorMessage } from '../common/ErrorMessage';
import { Project, ProjectStatus } from '../../types/project';
import { projectsApi } from '../../api/projects';
import { getErrorMessage } from '../../utils/errors';

interface ProjectStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project | null;
}

export const ProjectStatusModal: React.FC<ProjectStatusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(
    project?.status || 'ACTIVE'
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      await projectsApi.updateStatus(project.id, {
        status: selectedStatus,
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
      title="Update Project Status"
      description={`Change lifecycle status for project "${project?.name}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <ErrorMessage message={serverError} onDismiss={() => setServerError(null)} />}

        <div>
          <label htmlFor="pstatus-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Select New Status
          </label>
          <select
            id="pstatus-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus)}
            disabled={isSubmitting}
            className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
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
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Status</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
