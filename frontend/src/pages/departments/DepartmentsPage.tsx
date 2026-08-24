import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterSelect } from '../../components/common/FilterSelect';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DepartmentModal } from '../../components/departments/DepartmentModal';
import { departmentsApi } from '../../api/departments';
import { Department } from '../../types/department';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'admin';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['departments', { search, activeFilter, page, pageSize }],
    queryFn: () =>
      departmentsApi.list({
        search: search || undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        page,
        page_size: pageSize,
        sort_by: 'name',
        sort_order: 'asc',
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDepartmentToDelete(null);
      setActionSuccessMsg('Department deactivated successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    },
  });

  const handleOpenCreate = () => {
    setDepartmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setDepartmentToEdit(dept);
    setIsModalOpen(true);
  };

  return (
    <PageContainer
      title="Departments"
      description="Manage organizational units and team structure."
      actions={
        isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </button>
        )
      }
    >
      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs mb-6">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search departments..."
          className="sm:w-80"
        />

        <div className="flex items-center gap-2">
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
            className="w-40"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text="Loading departments..." />
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Failed to Load Departments"
          message={getErrorMessage(error)}
          className="my-6"
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description={
            search || activeFilter
              ? 'No departments matched your search or filters.'
              : 'Create your first organizational department to get started.'
          }
          action={
            isAdmin && !search && !activeFilter
              ? {
                  label: 'Create Department',
                  onClick: handleOpenCreate,
                }
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 sm:px-6">Department Name</th>
                  <th className="py-3 px-4 sm:px-6">Description</th>
                  <th className="py-3 px-4 sm:px-6">Status</th>
                  <th className="py-3 px-4 sm:px-6">Created</th>
                  {isAdmin && <th className="py-3 px-4 sm:px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.items.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-4 sm:px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-xs">{dept.name}</span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs max-w-sm truncate">
                      {dept.description || <span className="text-slate-400 italic">No description</span>}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <StatusBadge status={dept.is_active} />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(dept.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(dept)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit department"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {dept.is_active && (
                            <button
                              onClick={() => setDepartmentToDelete(dept)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Deactivate department"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg(
            departmentToEdit
              ? 'Department updated successfully.'
              : 'Department created successfully.'
          );
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        departmentToEdit={departmentToEdit}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        onClose={() => setDepartmentToDelete(null)}
        onConfirm={() => {
          if (departmentToDelete) {
            deactivateMutation.mutate(departmentToDelete.id);
          }
        }}
        title="Deactivate Department"
        message={`Are you sure you want to deactivate "${departmentToDelete?.name}"? Inactive departments cannot be assigned to new projects or employees.`}
        confirmText="Deactivate"
        isLoading={deactivateMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
};
