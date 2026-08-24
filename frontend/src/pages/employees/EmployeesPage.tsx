import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Building2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterSelect } from '../../components/common/FilterSelect';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AssignDepartmentModal } from '../../components/employees/AssignDepartmentModal';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { Employee } from '../../types/employee';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';

export const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'admin';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [employeeToAssign, setEmployeeToAssign] = useState<Employee | null>(null);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Fetch departments for filter dropdown
  const { data: deptData } = useQuery({
    queryKey: ['departments-filter-options'],
    queryFn: () => departmentsApi.list({ page_size: 100 }),
  });

  // 2. Fetch employees
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employees', { search, departmentFilter, activeFilter, page, pageSize }],
    queryFn: () =>
      employeesApi.list({
        search: search || undefined,
        department_id: departmentFilter || undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        page,
        page_size: pageSize,
        sort_by: 'full_name',
        sort_order: 'asc',
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => employeesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEmployeeToDeactivate(null);
      setActionSuccessMsg('Employee deactivated successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    },
  });

  const departmentOptions =
    deptData?.items.map((d) => ({
      value: d.id,
      label: d.name,
    })) || [];

  return (
    <PageContainer
      title="Employees"
      description="Manage organization members, department allocations, and role access."
    >
      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs mb-6">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="lg:w-80"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            value={departmentFilter}
            onChange={(val) => {
              setDepartmentFilter(val);
              setPage(1);
            }}
            placeholder="All Departments"
            options={departmentOptions}
            className="w-48"
          />

          <FilterSelect
            value={activeFilter}
            onChange={(val) => {
              setActiveFilter(val);
              setPage(1);
            }}
            placeholder="All Statuses"
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text="Loading employees..." />
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Failed to Load Employees"
          message={getErrorMessage(error)}
          className="my-6"
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={
            search || departmentFilter || activeFilter
              ? 'No team members matched your current filter criteria.'
              : 'Registered company employees will appear here.'
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 sm:px-6">Member</th>
                  <th className="py-3 px-4 sm:px-6">Role</th>
                  <th className="py-3 px-4 sm:px-6">Department</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                  <th className="py-3 px-4 sm:px-6">Joined</th>
                  {isAdmin && <th className="py-3 px-4 sm:px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.items.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {emp.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{emp.full_name}</p>
                          <p className="text-xs text-slate-500 font-normal truncate">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.role?.name || 'employee'}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {emp.department ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200/80">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[130px]">{emp.department.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <StatusBadge status={emp.is_active} />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setEmployeeToAssign(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors cursor-pointer"
                            title="Assign Department"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Assign Dept</span>
                          </button>
                          {emp.is_active && emp.id !== user?.id && (
                            <button
                              onClick={() => setEmployeeToDeactivate(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Deactivate Employee"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/40">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data.total}
              pages={data.pages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </div>
      )}

      {/* Assign Department Modal */}
      <AssignDepartmentModal
        isOpen={Boolean(employeeToAssign)}
        onClose={() => setEmployeeToAssign(null)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg('Department assigned successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        employee={employeeToAssign}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(employeeToDeactivate)}
        onClose={() => setEmployeeToDeactivate(null)}
        onConfirm={() => {
          if (employeeToDeactivate) {
            deactivateMutation.mutate(employeeToDeactivate.id);
          }
        }}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${employeeToDeactivate?.full_name}? They will no longer be able to log in or manage tasks.`}
        confirmText="Deactivate"
        isLoading={deactivateMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
};
