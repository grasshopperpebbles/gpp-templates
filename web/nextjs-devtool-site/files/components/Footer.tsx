import Link from "next/link";

const footerLinks = {
  docs: [
    { name: "Getting Started", href: "/docs/getting-started" },
    { name: "Platforms", href: "/docs/platforms" },
    { name: "Templates", href: "/docs/templates" },
    { name: "Commands", href: "/docs/commands" },
  ],
  community: [
    { name: "GitHub", href: "https://github.com/grasshopperpebbles/gpp" },
    {
      name: "Issues",
      href: "https://github.com/grasshopperpebbles/gpp/issues",
    },
    {
      name: "Discussions",
      href: "https://github.com/grasshopperpebbles/gpp/discussions",
    },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              GPP
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Multi-platform project toolkit for modern development.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Documentation
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.docs.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Community
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} GPP. MIT License.
          </p>
        </div>
      </div>
    </footer>
  );
}
