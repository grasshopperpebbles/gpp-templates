"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Installation", href: "/docs/getting-started/installation" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start" },
    ],
  },
  {
    title: "Platforms",
    items: [
      { title: "Overview", href: "/docs/platforms" },
      { title: "Web (Next.js)", href: "/docs/platforms/web" },
      { title: "API (FastAPI/Express)", href: "/docs/platforms/api" },
      { title: "Mobile (Flutter/Expo)", href: "/docs/platforms/mobile" },
      { title: "CMS (WordPress/Strapi)", href: "/docs/platforms/cms" },
      { title: "Desktop (Electron/Tauri)", href: "/docs/platforms/desktop" },
    ],
  },
  {
    title: "Commands",
    items: [
      { title: "gpp init", href: "/docs/commands/init" },
      { title: "gpp add", href: "/docs/commands/add" },
      { title: "gpp start/stop", href: "/docs/commands/start-stop" },
      { title: "gpp template", href: "/docs/commands/template" },
      { title: "gpp wire", href: "/docs/commands/wire" },
    ],
  },
  {
    title: "Templates",
    items: [
      { title: "Using Templates", href: "/docs/templates" },
      { title: "Creating Templates", href: "/docs/templates/creating" },
      { title: "Template Registry", href: "/docs/templates/registry" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-24 overflow-y-auto max-h-[calc(100vh-6rem)] pb-10">
        {navigation.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(
                      "block text-sm py-1 px-3 rounded-lg transition-colors",
                      pathname === item.href
                        ? "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
