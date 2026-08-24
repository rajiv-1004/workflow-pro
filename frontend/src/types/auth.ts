import { User } from './user';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
