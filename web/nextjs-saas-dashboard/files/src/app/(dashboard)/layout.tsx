"use client";

import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { Sidebar, SidebarLayout } from "@/components/layout/sidebar";
import { features } from "@/lib/config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

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

  const mainItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
  ];

  const adminItems = [
    ...(features.teams
      ? [{ href: "/admin/team", label: "Team" }]
      : []),
    ...(features.billing
      ? [{ href: "/admin/billing", label: "Billing" }]
      : []),
  ];

  const groups = [
    { label: "Main", items: mainItems },
    ...(adminItems.length > 0
      ? [{ label: "Admin", items: adminItems }]
      : []),
  ];

  return (
    <SidebarLayout sidebar={<Sidebar groups={groups} />}>
      {children}
    </SidebarLayout>
  );
}
