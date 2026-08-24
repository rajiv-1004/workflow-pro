export type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID' | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: LeaveStatus;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveCreatePayload {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
}

export interface LeaveUpdatePayload {
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

export interface LeaveReviewPayload {
  review_comment?: string;
}

export interface PaginatedLeaveResponse {
  items: LeaveRequest[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface LeaveListParams {
  employee_id?: string;
  department_id?: string;
  leave_type?: LeaveType;
  status?: LeaveStatus;
  start_date?: string;
  end_date?: string;
  sort_by?: 'start_date' | 'end_date' | 'status' | 'leave_type' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
