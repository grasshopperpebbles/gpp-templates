import Link from "next/link";
import { Search } from "./Search";

export function SiteHeader() {
  const name = process.env.NEXT_PUBLIC_SITE_NAME ?? "GPP Web";
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          {name}
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href="/about" className="hover:text-zinc-900">
              About
            </Link>
            <Link href="/contact" className="hover:text-zinc-900">
              Contact
            </Link>
          </nav>
          <Search />
        </div>
      </div>
    </header>
  );
}
