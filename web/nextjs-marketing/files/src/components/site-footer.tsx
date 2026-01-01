import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "GPP Web";

  return (
    <footer className="border-t border-zinc-200 mt-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold mb-4">{siteName}</h3>
            <p className="text-sm text-zinc-600">
              Building great experiences with modern web technologies.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4 text-sm">Pages</h4>
            <nav className="flex flex-col space-y-2 text-sm text-zinc-600">
              <Link href="/" className="hover:text-zinc-900">
                Home
              </Link>
              <Link href="/about" className="hover:text-zinc-900">
                About
              </Link>
              <Link href="/contact" className="hover:text-zinc-900">
                Contact
              </Link>
            </nav>
          </div>
          
          <div>
            <h4 className="font-medium mb-4 text-sm">Legal</h4>
            <nav className="flex flex-col space-y-2 text-sm text-zinc-600">
              <Link href="/privacy" className="hover:text-zinc-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-zinc-900">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-zinc-200">
          <p className="text-xs text-zinc-500 text-center">
            © {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
