"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { features } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export default function BillingPage() {
  if (!features.billing) {
    redirect("/dashboard");
  }

  const { isAdmin } = useAuth();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const { data: billingInfo, isLoading } = useQuery({
    queryKey: ["billing"],
    queryFn: () => apiClient.get("/admin/billing"),
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
      <div>
        <h1 className="text-3xl font-semibold">Billing</h1>
        <p className="text-zinc-600 mt-2">
          Manage subscription and billing information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
          <div className="space-y-2">
            <p className="text-2xl font-semibold">
              {billingInfo?.plan || "Free"}
            </p>
            <p className="text-sm text-zinc-600">
              {billingInfo?.status || "Active"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Usage</h2>
          <div className="space-y-2">
            <p className="text-sm text-zinc-600">
              This billing management page is ready for integration with your
              payment provider (Stripe, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
