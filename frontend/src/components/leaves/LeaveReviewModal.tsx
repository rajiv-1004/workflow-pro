import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { leavesApi } from '../../api/leaves';
import { LeaveRequest } from '../../types/leave';
import { LeaveTypeBadge } from './LeaveTypeBadge';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errors';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveRequest | null;
  mode: 'approve' | 'reject';
  employeeName?: string;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  leave,
  mode,
  employeeName,
}) => {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isApprove = mode === 'approve';

  const mutation = useMutation({
    mutationFn: async () => {
      if (!leave) throw new Error('No leave request selected');
      const payload = comment.trim() ? { review_comment: comment.trim() } : {};
      if (isApprove) {
        return leavesApi.approve(leave.id, payload);
      } else {
        return leavesApi.reject(leave.id, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-leaves-count'] });
      handleClose();
    },
    onError: (err: unknown) => {
      setError(extractErrorMessage(err));
    },
  });

  const handleClose = () => {
    setError(null);
    setComment('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (!leave) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isApprove ? 'Approve Leave Request' : 'Reject Leave Request'}
      description={
        isApprove
          ? 'Confirm leave authorization and optionally provide notes for the employee.'
          : 'Provide reasons for declining this leave request.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Leave Summary Info Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
          {employeeName && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Employee:</span>
              <span className="font-semibold text-slate-800">{employeeName}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Leave Type:</span>
            <LeaveTypeBadge type={leave.leave_type} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Dates:</span>
            <span className="font-semibold text-slate-800">
              {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
            </span>
          </div>
          {leave.reason && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium block mb-1">Reason:</span>
              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 italic">
                "{leave.reason}"
              </p>
            </div>
          )}
        </div>

        {/* Reviewer Note */}
        <div>
          <label htmlFor="review_comment" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reviewer Comment <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            id="review_comment"
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isApprove
                ? 'e.g. Approved. Please ensure tasks are handed over.'
                : 'e.g. Due to project sprint deadline, request cannot be accommodated.'
            }
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons */}
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
            className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 ${
              isApprove
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {mutation.isPending ? (
              <span>Processing...</span>
            ) : isApprove ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Approval</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
