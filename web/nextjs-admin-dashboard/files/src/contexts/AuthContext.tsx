"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, User, ApiClientError } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (authApi.isAuthenticated()) {
        const userData = await authApi.getMe();
        // Admin dashboard requires admin role
        if (userData.role !== "admin") {
          authApi.logout();
          setUser(null);
        } else {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Token might be expired, try to refresh
      if (error instanceof ApiClientError && error.status === 401) {
        const refreshed = await authApi.refreshToken();
        if (refreshed) {
          try {
            const userData = await authApi.getMe();
            if (userData.role === "admin") {
              setUser(userData);
            } else {
              authApi.logout();
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    const userData = await authApi.getMe();

    // Admin dashboard requires admin role
    if (userData.role !== "admin") {
      authApi.logout();
      throw new Error("Access denied. Admin privileges required.");
    }

    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (authApi.isAuthenticated()) {
      try {
        const userData = await authApi.getMe();
        if (userData.role === "admin") {
          setUser(userData);
        } else {
          authApi.logout();
          setUser(null);
        }
      } catch {
        const refreshed = await authApi.refreshToken();
        if (refreshed) {
          const userData = await authApi.getMe();
          if (userData.role === "admin") {
            setUser(userData);
          } else {
            authApi.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    }
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
