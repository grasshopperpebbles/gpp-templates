"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { ApiClientError, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const sessionUser = session?.user;
  const user: User | null = useMemo(
    () =>
      sessionUser
        ? {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name ?? undefined,
            role: sessionUser.role,
          }
        : null,
    [sessionUser]
  );
  const isLoading = status === "loading";

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        throw new ApiClientError(result?.error || "Login failed");
      }

      const updated = await update();
      const nextRole = updated?.user?.role ?? session?.user?.role;
      if (nextRole !== "admin") {
        await signOut({ redirect: false });
        throw new Error("Access denied. Admin privileges required.");
      }
    },
    [session?.user?.role, update]
  );

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  const register = useCallback(async () => {
    throw new Error("Admin self-registration is disabled.");
  }, []);

  const refreshUser = useCallback(async () => {
    await update();
  }, [update]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      register,
      refreshUser,
    }),
    [user, isLoading, login, logout, register, refreshUser]
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
