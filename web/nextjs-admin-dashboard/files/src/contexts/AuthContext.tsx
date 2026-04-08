"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { ApiClientError, setApiAccessToken, User } from "@/lib/api";
import { graphqlClient } from "@/lib/graphql";

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
  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? undefined,
        role: session.user.role,
      }
    : null;
  const isLoading = status === "loading";

  useEffect(() => {
    setApiAccessToken(session?.accessToken ?? null);
    graphqlClient.setAuthToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

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
        setApiAccessToken(null);
        graphqlClient.setAuthToken(null);
        await signOut({ redirect: false });
        throw new Error("Access denied. Admin privileges required.");
      }
    },
    [session?.user?.role, update]
  );

  const logout = useCallback(async () => {
    setApiAccessToken(null);
    graphqlClient.setAuthToken(null);
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
