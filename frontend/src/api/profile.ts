import { apiClient } from './client';
import {
  PasswordChangePayload,
  PasswordChangeResponse,
  ProfileResponse,
  ProfileUpdatePayload,
} from '../types/profile';

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>('/profile/me');
    return response.data;
  },

  updateProfile: async (payload: ProfileUpdatePayload): Promise<ProfileResponse> => {
    const response = await apiClient.patch<ProfileResponse>('/profile/me', payload);
    return response.data;
  },

  changePassword: async (payload: PasswordChangePayload): Promise<PasswordChangeResponse> => {
    const response = await apiClient.patch<PasswordChangeResponse>(
      '/profile/change-password',
      payload
    );
    return response.data;
  },
};
