export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY';

export interface AttendanceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string;
  check_out?: string | null;
  working_minutes: number;
  status: AttendanceStatus;
  is_late: boolean;
  late_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedAttendanceResponse {
  items: AttendanceRecord[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  late_days: number;
  total_working_minutes: number;
  average_working_minutes: number;
}

export interface AttendanceListParams {
  employee_id?: string;
  department_id?: string;
  status?: AttendanceStatus;
  is_late?: boolean;
  start_date?: string;
  end_date?: string;
  sort_by?: 'attendance_date' | 'check_in' | 'check_out' | 'working_minutes' | 'status' | 'is_late' | 'late_minutes' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface AttendanceSummaryParams {
  month?: number;
  year?: number;
}
