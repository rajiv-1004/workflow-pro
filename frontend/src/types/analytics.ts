export interface TaskStatusDistribution {
  todo: number;
  in_progress: number;
  in_review: number;
  completed: number;
  cancelled: number;
  total: number;
  completion_rate: number;
}

export interface ProjectStatusDistribution {
  planning: number;
  active: number;
  on_hold: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface DepartmentMetric {
  id: string;
  name: string;
  employee_count: number;
}

export interface AttendanceAnalytics {
  total_records: number;
  present_count: number;
  late_count: number;
  average_working_minutes: number;
  attendance_rate: number;
}

export interface LeaveAnalytics {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  cancelled_count: number;
  by_type: Record<string, number>;
}

export interface DashboardSummary {
  total_employees: number;
  active_employees: number;
  total_departments: number;
  total_projects: number;
  active_projects: number;
  total_tasks: number;
  open_tasks: number;
  completed_tasks: number;
  pending_leaves: number;
}

export interface DashboardAnalyticsResponse {
  role: string;
  summary: DashboardSummary;
  tasks: TaskStatusDistribution;
  projects: ProjectStatusDistribution;
  departments: DepartmentMetric[];
  attendance: AttendanceAnalytics;
  leaves: LeaveAnalytics;
}
