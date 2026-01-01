"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { features } from "@/lib/config";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavProps {
  items: NavItem[];
  className?: string;
}

export function Nav({ items, className }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-zinc-900 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

interface HeaderProps {
  logo?: React.ReactNode;
  navItems?: NavItem[];
  children?: React.ReactNode;
}

export function Header({ logo, navItems = [], children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          {logo || (
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">App</span>
            </Link>
          )}
        </div>
        {navItems.length > 0 && (
          <Nav items={navItems} className="hidden md:flex" />
        )}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {children}
        </div>
      </div>
    </header>
  );
}
