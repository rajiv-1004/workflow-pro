import React, { createContext, useEffect, useState, useCallback } from 'react';
import { AuthContextType } from '../types/auth';
import { User } from '../types/user';
import { storage } from '../utils/storage';
import { usersApi } from '../api/endpoints';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => storage.getToken());
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await usersApi.getCurrentUser();
      setUser(profile);
      storage.setUser(profile);
    } catch {
      // If fetching user profile fails (e.g. invalid/expired token), clean up
      storage.clearAll();
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = storage.getToken();
      if (token) {
        setAccessToken(token);
        await fetchUserProfile();
      } else {
        setIsLoading(false);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchUserProfile]);

  const login = async (token: string, userData?: User) => {
    storage.setToken(token);
    setAccessToken(token);

    if (userData) {
      setUser(userData);
      storage.setUser(userData);
    } else {
      try {
        const profile = await usersApi.getCurrentUser();
        setUser(profile);
        storage.setUser(profile);
      } catch {
        // Fallback
      }
    }
  };

  const logout = () => {
    storage.clearAll();
    setAccessToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (accessToken) {
      await fetchUserProfile();
    }
  };

  const value: AuthContextType = {
    accessToken,
    isAuthenticated: Boolean(accessToken),
    user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
