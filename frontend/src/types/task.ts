export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  is_active: boolean;
  project_id: string;
  company_id: string;
  assigned_to_id: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  project_id: string;
  assigned_to_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  project_id?: string;
  assigned_to_id?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string | null;
}

export interface TaskStatusUpdatePayload {
  status: TaskStatus;
}

export interface TaskAssignmentPayload {
  assigned_to_id: string | null;
}
