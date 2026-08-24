import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  ExternalLink,
  RefreshCcw,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { SearchInput } from '../../components/common/SearchInput';
import { FilterSelect } from '../../components/common/FilterSelect';
import { Pagination } from '../../components/common/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ProjectModal } from '../../components/projects/ProjectModal';
import { ProjectStatusModal } from '../../components/projects/ProjectStatusModal';
import { projectsApi } from '../../api/projects';
import { departmentsApi } from '../../api/departments';
import { Project, ProjectStatus } from '../../types/project';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.name || 'employee';
  const canManageProjects = userRole === 'admin' || userRole === 'manager';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToStatusUpdate, setProjectToStatusUpdate] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 1. Fetch departments for filter
  const { data: deptData } = useQuery({
    queryKey: ['departments-options'],
    queryFn: () => departmentsApi.list({ page_size: 100 }),
  });

  // 2. Fetch projects
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'projects',
      { search, statusFilter, departmentFilter, activeFilter, page, pageSize },
    ],
    queryFn: () =>
      projectsApi.list({
        search: search || undefined,
        status: statusFilter ? (statusFilter as ProjectStatus) : undefined,
        department_id: departmentFilter || undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        page,
        page_size: pageSize,
        sort_by: 'created_at',
        sort_order: 'desc',
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setProjectToDelete(null);
      setActionSuccessMsg('Project deactivated successfully.');
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
      title="Projects"
      description="Track milestones, managers, and status lifecycles across company projects."
      actions={
        canManageProjects && (
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
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

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs mb-6">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search projects..."
          className="lg:w-80"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            placeholder="All Statuses"
            options={[
              { value: 'PLANNING', label: 'Planning' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'ON_HOLD', label: 'On Hold' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            className="w-36"
          />

          <FilterSelect
            value={departmentFilter}
            onChange={(val) => {
              setDepartmentFilter(val);
              setPage(1);
            }}
            placeholder="All Departments"
            options={departmentOptions}
            className="w-44"
          />

          <FilterSelect
            value={activeFilter}
            onChange={(val) => {
              setActiveFilter(val);
              setPage(1);
            }}
            placeholder="All Records"
            options={[
              { value: 'true', label: 'Active Only' },
              { value: 'false', label: 'Inactive Only' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" text="Loading projects..." />
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Failed to Load Projects"
          message={getErrorMessage(error)}
          className="my-6"
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            search || statusFilter || departmentFilter || activeFilter
              ? 'No projects matched your search filters.'
              : 'Create a new project to start organizing tasks and milestones.'
          }
          action={
            canManageProjects && !search && !statusFilter && !departmentFilter
              ? {
                  label: 'Create Project',
                  onClick: () => {
                    setProjectToEdit(null);
                    setIsCreateModalOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge status={project.status} size="md" />
                    {!project.is_active && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-slate-100 text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="block group-hover:text-brand-600 transition-colors"
                  >
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {project.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Timeline:</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {project.due_date
                          ? new Date(project.due_date).toLocaleDateString()
                          : 'No due date'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {canManageProjects && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setProjectToStatusUpdate(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                        title="Update Status"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setProjectToEdit(project);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {project.is_active && (
                        <button
                          onClick={() => setProjectToDelete(project)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Deactivate Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
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

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg(
            projectToEdit ? 'Project updated successfully.' : 'Project created successfully.'
          );
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        projectToEdit={projectToEdit}
      />

      {/* Update Project Status Modal */}
      <ProjectStatusModal
        isOpen={Boolean(projectToStatusUpdate)}
        onClose={() => setProjectToStatusUpdate(null)}
        onSuccess={() => {
          refetch();
          setActionSuccessMsg('Project status updated successfully.');
          setTimeout(() => setActionSuccessMsg(null), 3500);
        }}
        project={projectToStatusUpdate}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            deactivateMutation.mutate(projectToDelete.id);
          }
        }}
        title="Deactivate Project"
        message={`Are you sure you want to deactivate project "${projectToDelete?.name}"?`}
        confirmText="Deactivate"
        isLoading={deactivateMutation.isPending}
        variant="danger"
      />
    </PageContainer>
  );
};
