"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-zinc-600 mt-2">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Email
              </label>
              <p className="text-sm text-zinc-600">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Name
              </label>
              <p className="text-sm text-zinc-600">{user?.name || "—"}</p>
            </div>
            <Link
              href="/settings/profile"
              className="text-sm text-blue-600 hover:underline"
            >
              Edit profile →
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <p className="text-sm text-zinc-600 mb-4">
            Customize your application preferences
          </p>
          <Link
            href="/settings/preferences"
            className="text-sm text-blue-600 hover:underline"
          >
            Manage preferences →
          </Link>
        </div>
      </div>
    </div>
  );
}
