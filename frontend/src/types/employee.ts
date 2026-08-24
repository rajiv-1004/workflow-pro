import { Department } from './department';
import { UserRole } from './user';

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  company_id: string;
  role_id: string;
  role?: {
    id: string;
    name: UserRole;
  };
  department_id: string | null;
  department: Department | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeUpdatePayload {
  full_name?: string;
}

export interface DepartmentAssignmentPayload {
  department_id: string | null;
}
