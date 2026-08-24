export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  company_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
  role?: {
    id: string;
    name: 'admin' | 'manager' | 'employee';
  };
  department_id?: string | null;
}

export type UserRole = 'admin' | 'manager' | 'employee';
