export interface EmployeeReportParams {
  department_id?: string;
}

export interface ProjectReportParams {
  status?: string;
}

export interface TaskReportParams {
  project_id?: string;
  status?: string;
  priority?: string;
}

export interface AttendanceReportParams {
  employee_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}
