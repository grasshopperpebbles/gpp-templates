"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { features } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function TeamManagementPage() {
  if (!features.teams) {
    redirect("/dashboard");
  }

  const { isAdmin } = useAuth();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => apiClient.get("/admin/team/members"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Team Management</h1>
          <p className="text-zinc-600 mt-2">
            Manage team members and their roles
          </p>
        </div>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Invite Member
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>
          {teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0 ? (
            <div className="space-y-2">
              {teamMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 p-4"
                >
                  <div>
                    <p className="font-medium">{member.name || member.email}</p>
                    <p className="text-sm text-zinc-600">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-600">
                      {member.role || "user"}
                    </span>
                    <button className="text-sm text-blue-600 hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600">No team members yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
