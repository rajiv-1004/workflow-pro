import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  CalendarOff,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  Eye,
  Edit2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../../components/layout/PageContainer';
import { leavesApi } from '../../api/leaves';
import { employeesApi } from '../../api/employees';
import { LeaveRequest, LeaveStatus, LeaveType } from '../../types/leave';
import { LeaveStatusBadge } from '../../components/leaves/LeaveStatusBadge';
import { LeaveTypeBadge } from '../../components/leaves/LeaveTypeBadge';
import { CreateLeaveModal } from '../../components/leaves/CreateLeaveModal';
import { EditLeaveModal } from '../../components/leaves/EditLeaveModal';
import { LeaveReviewModal } from '../../components/leaves/LeaveReviewModal';
import { LeaveDetailsModal } from '../../components/leaves/LeaveDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';

export const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userRole = user?.role?.name || 'employee';
  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  // Tabs: 'my' or 'team'
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | ''>('');
  const [selectedType, setSelectedType] = useState<LeaveType | ''>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [cancellingLeave, setCancellingLeave] = useState<LeaveRequest | null>(null);
  const [reviewingLeave, setReviewingLeave] = useState<{ leave: LeaveRequest; mode: 'approve' | 'reject' } | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  // Fetch Employees map for displaying names in team view
  const { data: employeesData } = useQuery({
    queryKey: ['employees-directory'],
    queryFn: () => employeesApi.list({ page_size: 100 }),
    enabled: isManagerOrAdmin,
  });

  const employeeMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (employeesData?.items) {
      employeesData.items.forEach((emp) => {
        map.set(emp.id, emp.full_name);
      });
    }
    return map;
  }, [employeesData]);

  // Query Leaves
  const {
    data: leavesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'leaves',
      activeTab,
      selectedStatus,
      selectedType,
      page,
      pageSize,
      user?.id,
    ],
    queryFn: () => {
      const params: Parameters<typeof leavesApi.list>[0] = {
        page,
        page_size: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      };
      if (selectedStatus) params.status = selectedStatus;
      if (selectedType) params.leave_type = selectedType;

      // In 'my' tab, or if normal employee, backend / current_user handles isolation,
      // but if manager/admin is in 'my' tab, we pass their employee_id explicitly
      if (activeTab === 'my' && isManagerOrAdmin && user?.id) {
        params.employee_id = user.id;
      }

      return leavesApi.list(params);
    },
  });

  // Cancel Leave Mutation
  const cancelMutation = useMutation({
    mutationFn: (leaveId: string) => leavesApi.cancel(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-leaves-count'] });
      setCancellingLeave(null);
    },
  });

  const handleCancelConfirm = () => {
    if (cancellingLeave) {
      cancelMutation.mutate(cancellingLeave.id);
    }
  };

  const getEmployeeName = (empId: string) => {
    if (empId === user?.id) return `${user.full_name} (You)`;
    return employeeMap.get(empId) || 'Employee';
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Request, track, and manage employee leave.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Leave Request</span>
        </button>
      </div>

      {/* Role-based Tab Switching (Admin/Manager) */}
      {isManagerOrAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab('my');
              setPage(1);
            }}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Leave Requests
          </button>
          <button
            onClick={() => {
              setActiveTab('team');
              setPage(1);
            }}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'team'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Team Leave Requests
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as LeaveStatus | '');
              setPage(1);
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as LeaveType | '');
              setPage(1);
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Leave Types</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="ANNUAL">Annual Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
            <option value="OTHER">Other Leave</option>
          </select>
        </div>

        {leavesData && (
          <span className="text-xs font-semibold text-slate-500">
            {leavesData.total} {leavesData.total === 1 ? 'record' : 'records'} total
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Failed to Load Leave Requests</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'Unable to connect with the backend service.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : !leavesData?.items || leavesData.items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center shadow-2xs">
          <CalendarOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No leave requests found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'team'
              ? 'No team leave requests match your selected filters.'
              : 'You have not submitted any leave requests yet.'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Leave Request</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {leavesData.items.map((leave) => {
            const isOwner = user?.id === leave.employee_id;
            const isPending = leave.status === 'PENDING';
            const empName = getEmployeeName(leave.employee_id);

            return (
              <div
                key={leave.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left side: Type, Dates, Employee, Reason */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <LeaveTypeBadge type={leave.leave_type} />
                    <LeaveStatusBadge status={leave.status} />

                    {activeTab === 'team' && (
                      <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {empName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span>
                      {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                    </span>
                  </div>

                  {leave.reason ? (
                    <p className="text-xs text-slate-600 line-clamp-1 italic">
                      "{leave.reason}"
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-400">No notes provided</span>
                  )}
                </div>

                {/* Right side: Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={() => setSelectedLeave(leave)}
                    className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors text-xs font-medium inline-flex items-center gap-1.5 border border-slate-200"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  {/* Owner Pending Actions */}
                  {isOwner && isPending && (
                    <>
                      <button
                        onClick={() => setEditingLeave(leave)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors text-xs font-medium inline-flex items-center gap-1.5 border border-slate-200"
                        title="Edit Request"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setCancellingLeave(leave)}
                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-medium inline-flex items-center gap-1.5 border border-rose-200"
                        title="Cancel Request"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {/* Manager/Admin Review Actions (prevent self-approval) */}
                  {isManagerOrAdmin && !isOwner && isPending && (
                    <>
                      <button
                        onClick={() => setReviewingLeave({ leave, mode: 'approve' })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => setReviewingLeave({ leave, mode: 'reject' })}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {leavesData.pages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                page={leavesData.page}
                pageSize={pageSize}
                total={leavesData.total}
                pages={leavesData.pages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <CreateLeaveModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Edit Modal */}
      <EditLeaveModal
        isOpen={!!editingLeave}
        onClose={() => setEditingLeave(null)}
        leave={editingLeave}
      />

      {/* Review Modal (Approve / Reject) */}
      <LeaveReviewModal
        isOpen={!!reviewingLeave}
        onClose={() => setReviewingLeave(null)}
        leave={reviewingLeave?.leave || null}
        mode={reviewingLeave?.mode || 'approve'}
        employeeName={reviewingLeave ? getEmployeeName(reviewingLeave.leave.employee_id) : undefined}
      />

      {/* Details Modal */}
      <LeaveDetailsModal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        leave={selectedLeave}
        currentUserId={user?.id}
        userRole={userRole}
        employeeName={selectedLeave ? getEmployeeName(selectedLeave.employee_id) : undefined}
        onEdit={(l) => setEditingLeave(l)}
        onCancel={(l) => setCancellingLeave(l)}
        onApprove={(l) => setReviewingLeave({ leave: l, mode: 'approve' })}
        onReject={(l) => setReviewingLeave({ leave: l, mode: 'reject' })}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingLeave}
        onClose={() => setCancellingLeave(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmText="Yes, Cancel Leave"
        cancelText="Keep Request"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </PageContainer>
  );
};
