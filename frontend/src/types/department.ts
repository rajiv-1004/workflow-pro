export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreatePayload {
  name: string;
  description?: string | null;
}

export interface DepartmentUpdatePayload {
  name?: string;
  description?: string | null;
}
