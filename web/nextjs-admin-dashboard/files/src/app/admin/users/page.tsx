"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function UsersManagementPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      redirect("/login");
    }
  }, [authLoading, isAuthenticated]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.get("/admin/users"),
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">User Management</h1>
          <p className="text-zinc-600 mt-2">
            Manage all users in the system
          </p>
        </div>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Add User
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users && Array.isArray(users) && users.length > 0 ? (
                  users.map((user: any) => (
                    <tr key={user.id} className="border-b border-zinc-100">
                      <td className="px-4 py-3 text-sm">{user.name || "—"}</td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.role || "user"}</td>
                      <td className="px-4 py-3 text-sm">
                        <button className="text-blue-600 hover:underline">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
