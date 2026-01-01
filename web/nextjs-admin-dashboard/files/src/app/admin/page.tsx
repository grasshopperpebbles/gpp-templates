"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/login");
    }
  }, [isLoading, isAuthenticated]);

  const { data: stats, isLoading: dataLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiClient.get("/admin/stats"),
    enabled: isAuthenticated,
  });

  if (isLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="text-zinc-600 mt-2">
          Welcome, {user?.name || user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-6">
          <h3 className="text-sm font-medium text-zinc-600">Total Users</h3>
          <p className="text-2xl font-semibold mt-2">
            {stats?.totalUsers || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-6">
          <h3 className="text-sm font-medium text-zinc-600">Active Sessions</h3>
          <p className="text-2xl font-semibold mt-2">
            {stats?.activeSessions || "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-6">
          <h3 className="text-sm font-medium text-zinc-600">System Status</h3>
          <p className="text-2xl font-semibold mt-2">
            {stats?.systemStatus || "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/users"
            className="rounded-md border border-zinc-200 p-4 hover:bg-zinc-50"
          >
            <h3 className="font-medium">User Management</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Manage users and permissions
            </p>
          </a>
          <a
            href="/admin/analytics"
            className="rounded-md border border-zinc-200 p-4 hover:bg-zinc-50"
          >
            <h3 className="font-medium">Analytics</h3>
            <p className="text-sm text-zinc-600 mt-1">
              View system analytics and reports
            </p>
          </a>
          <a
            href="/admin/settings"
            className="rounded-md border border-zinc-200 p-4 hover:bg-zinc-50"
          >
            <h3 className="font-medium">Settings</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Configure system settings
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
