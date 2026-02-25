"use client";

import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { features } from "@/lib/config";

interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const user: User | null = React.useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
    };
  }, [session]);

  const login = React.useCallback(async (email: string, password: string) => {
    if (!features.auth) {
      throw new Error("Authentication is not enabled");
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error === "CredentialsSignin" ? "Invalid credentials" : result.error);
    }
  }, []);

  const logout = React.useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  const register = React.useCallback(
    async (email: string, password: string, name?: string) => {
      if (!features.auth) {
        throw new Error("Authentication is not enabled");
      }

      // Register via API first
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Registration failed");
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Registration succeeded but login failed");
      }
    },
    []
  );

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!session,
      login,
      logout,
      register,
    }),
    [user, isLoading, session, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
