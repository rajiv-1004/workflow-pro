import React from 'react';
import { Calendar, User, Clock, FileText, CheckCircle2, XCircle, Ban, Edit2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LeaveRequest } from '../../types/leave';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { LeaveTypeBadge } from './LeaveTypeBadge';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: LeaveRequest | null;
  currentUserId?: string;
  userRole?: string;
  employeeName?: string;
  onEdit?: (leave: LeaveRequest) => void;
  onCancel?: (leave: LeaveRequest) => void;
  onApprove?: (leave: LeaveRequest) => void;
  onReject?: (leave: LeaveRequest) => void;
}

export const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  isOpen,
  onClose,
  leave,
  currentUserId,
  userRole = 'employee',
  employeeName,
  onEdit,
  onCancel,
  onApprove,
  onReject,
}) => {
  if (!leave) return null;

  const isOwner = currentUserId === leave.employee_id;
  const isPending = leave.status === 'PENDING';
  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Request Details"
      description={`Reference ID: ${leave.id}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Status Header Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Current Status
            </span>
            <LeaveStatusBadge status={leave.status} size="md" />
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Category
            </span>
            <LeaveTypeBadge type={leave.leave_type} />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" /> Start Date
            </span>
            <p className="text-sm font-bold text-slate-800">{formatDate(leave.start_date)}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" /> End Date
            </span>
            <p className="text-sm font-bold text-slate-800">{formatDate(leave.end_date)}</p>
          </div>

          {employeeName && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" /> Employee
              </span>
              <p className="text-sm font-semibold text-slate-800">{employeeName}</p>
            </div>
          )}

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500" /> Requested On
            </span>
            <p className="text-xs font-semibold text-slate-700">{formatDateTime(leave.created_at)}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-600" /> Employee Reason / Notes:
          </span>
          <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200/80">
            {leave.reason ? `"${leave.reason}"` : 'No additional reason provided.'}
          </p>
        </div>

        {/* Review Info (if reviewed) */}
        {leave.status !== 'PENDING' && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-semibold text-slate-700">Review Outcome:</span>
              <span className="text-slate-500">{formatDateTime(leave.reviewed_at)}</span>
            </div>
            {leave.review_comment && (
              <div>
                <span className="text-slate-500 font-medium block mb-1">Reviewer Feedback:</span>
                <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                  "{leave.review_comment}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Owner Actions */}
            {isOwner && isPending && (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit(leave);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Request
                  </button>
                )}
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCancel(leave);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" /> Cancel Request
                  </button>
                )}
              </>
            )}

            {/* Manager/Admin Actions (Self-approval prevented) */}
            {isManagerOrAdmin && !isOwner && isPending && (
              <>
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApprove(leave);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {onReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReject(leave);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
              </>
            )}

            {isManagerOrAdmin && isOwner && isPending && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                Self-approval not permitted. Another admin/manager must review this request.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
