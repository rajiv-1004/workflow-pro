import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { leavesApi } from '../../api/leaves';
import { LeaveRequest, LeaveType, LeaveUpdatePayload } from '../../types/leave';
import { extractErrorMessage } from '../../utils/errors';

interface EditLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveRequest | null;
}

const leaveTypes: { value: LeaveType; label: string }[] = [
  { value: 'CASUAL', label: 'Casual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
  { value: 'OTHER', label: 'Other Leave' },
];

export const EditLeaveModal: React.FC<EditLeaveModalProps> = ({ isOpen, onClose, leave }) => {
  const queryClient = useQueryClient();

  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (leave) {
      setLeaveType(leave.leave_type);
      setStartDate(leave.start_date);
      setEndDate(leave.end_date);
      setReason(leave.reason || '');
      setFormError(null);
    }
  }, [leave]);

  const mutation = useMutation({
    mutationFn: (payload: LeaveUpdatePayload) => {
      if (!leave) throw new Error('No leave request selected');
      return leavesApi.update(leave.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      handleClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { detail?: string } } };
      if (err.response?.status === 409) {
        setFormError('You already have an overlapping leave request for this period.');
      } else {
        setFormError(extractErrorMessage(error));
      }
    },
  });

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!startDate) {
      setFormError('Start date is required.');
      return;
    }
    if (!endDate) {
      setFormError('End date is required.');
      return;
    }
    if (endDate < startDate) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }

    mutation.mutate({
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Leave Request"
      description="Update details for your pending leave request."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label htmlFor="edit_leave_type" className="block text-xs font-semibold text-slate-700 mb-1">
            Leave Type
          </label>
          <select
            id="edit_leave_type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {leaveTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit_start_date" className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date
            </label>
            <input
              id="edit_start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label htmlFor="edit_end_date" className="block text-xs font-semibold text-slate-700 mb-1">
              End Date
            </label>
            <input
              id="edit_end_date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit_leave_reason" className="block text-xs font-semibold text-slate-700 mb-1">
            Reason / Notes
          </label>
          <textarea
            id="edit_leave_reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
