export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  is_active: boolean;
  company_id: string;
  department_id: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  start_date?: string | null;
  due_date?: string | null;
  department_id?: string | null;
  manager_id?: string | null;
}

export interface ProjectUpdatePayload {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  start_date?: string | null;
  due_date?: string | null;
  department_id?: string | null;
  manager_id?: string | null;
}

export interface ProjectStatusUpdatePayload {
  status: ProjectStatus;
}
