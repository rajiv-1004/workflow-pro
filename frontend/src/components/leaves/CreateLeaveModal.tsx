import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { leavesApi } from '../../api/leaves';
import { LeaveType, LeaveCreatePayload } from '../../types/leave';
import { extractErrorMessage } from '../../utils/errors';

interface CreateLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
  { value: 'CASUAL', label: 'Casual Leave', description: 'Short planned personal time off' },
  { value: 'SICK', label: 'Sick Leave', description: 'Medical recovery and doctor appointments' },
  { value: 'ANNUAL', label: 'Annual Leave', description: 'Vacation and extended rest periods' },
  { value: 'UNPAID', label: 'Unpaid Leave', description: 'Leave taken without pay' },
  { value: 'OTHER', label: 'Other Leave', description: 'Special circumstances or bereavement' },
];

export const CreateLeaveModal: React.FC<CreateLeaveModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: LeaveCreatePayload) => leavesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-leaves-count'] });
      handleClose();
    },
    onError: (error: unknown) => {
      // Check for 409 conflict
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
    setReason('');
    setLeaveType('CASUAL');
    setStartDate(today);
    setEndDate(today);
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
      title="Request Time Off"
      description="Submit a new leave request for review."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        {/* Leave Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Leave Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {leaveTypes.map((t) => (
              <label
                key={t.value}
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  leaveType === t.value
                    ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-1 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="leave_type"
                  value={t.value}
                  checked={leaveType === t.value}
                  onChange={() => setLeaveType(t.value)}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{t.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="end_date" className="block text-xs font-semibold text-slate-700 mb-1.5">
              End Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="end_date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Reason / Notes */}
        <div>
          <label htmlFor="leave_reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reason / Notes <span className="text-slate-400 font-normal">(Optional, max 500 chars)</span>
          </label>
          <textarea
            id="leave_reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief explanation for your manager..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-400"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-slate-400">{reason.length}/500</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {mutation.isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Leave Request</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
