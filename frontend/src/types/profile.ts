export interface ProfileResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  company_id: string;
  role_id: string;
  role_name: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdatePayload {
  full_name: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordChangeResponse {
  message: string;
}
