import { apiClient } from './client';
import { LoginResponse } from '../types/auth';
import { User } from '../types/user';

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  company_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    const params = new URLSearchParams();
    params.append('username', credentials.email);
    params.append('password', credentials.password);

    const response = await apiClient.post<LoginResponse>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', payload);
    return response.data;
  },
};

export const usersApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },
};
