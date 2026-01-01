"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect("/login");
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
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
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-zinc-600 mt-2">
          Welcome back, {user?.name || user?.email}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Add your dashboard cards here */}
        <div className="rounded-lg border border-zinc-200 p-6">
          <h3 className="text-sm font-medium text-zinc-600">Card Title</h3>
          <p className="text-2xl font-semibold mt-2">—</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-zinc-600">
          Dashboard content will be displayed here. Customize this page based on
          your application needs.
        </p>
      </div>
    </div>
  );
}
