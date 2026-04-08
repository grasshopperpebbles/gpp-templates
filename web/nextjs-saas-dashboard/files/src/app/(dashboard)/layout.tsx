import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Sidebar, SidebarLayout } from "@/components/layout/sidebar";
import { features } from "@/lib/config";
import { authOptions } from "@/lib/auth-config";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const mainItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
  ];

  const adminItems = [
    ...(session.user.role === "admin" && features.teams
      ? [{ href: "/admin/team", label: "Team" }]
      : []),
    ...(session.user.role === "admin" && features.billing
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
