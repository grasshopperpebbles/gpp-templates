"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SidebarGroup {
  label?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  className?: string;
  collapsed?: boolean;
}

export function Sidebar({ groups, className, collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <nav className="flex-1 space-y-1 p-2">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {group.label && !collapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {group.label}
              </h3>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && (
                    <span className="flex h-5 w-5 items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  return (
    <div className="flex h-screen">
      {sidebar}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
